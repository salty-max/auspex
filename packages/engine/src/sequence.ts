import { diceDistribution } from './dice'
import {
  binomial,
  convolve,
  type Distribution,
  mean,
  percentile,
  point,
  probAtLeast,
  shift,
  variance,
} from './distribution'
import {
  atLeastOnD6,
  critProbability,
  hitProbability,
  saveFailProbability,
  woundProbability,
} from './rules'
import type {
  Modifiers,
  SimResult,
  Target,
  Weapon,
  WeaponKeywords,
} from './types'

/**
 * Resolve a weapon against a target and return the exact distribution of damage dealt.
 *
 * The attack sequence is composed stage by stage as a transformation of probability
 * distributions: number of attacks → hits → wounds → unsaved wounds → damage → Feel No
 * Pain. No dice are rolled — the result is the exact distribution, identical on every run.
 *
 * Implemented keywords: Sustained Hits, Lethal Hits. Devastating Wounds and
 * per-model overkill are layered on separately.
 */
export function simulate(
  weapon: Weapon,
  target: Target,
  mods: Modifiers = {}
): SimResult {
  const pHit =
    weapon.skill === 'torrent'
      ? 1
      : hitProbability(weapon.skill, mods.hit ?? 0, mods.rerollHit)
  const pWound = woundProbability(
    weapon.strength,
    target.toughness,
    mods.wound ?? 0,
    mods.rerollWound
  )
  const pFail = saveFailProbability({
    save: target.save,
    invuln: target.invuln,
    ap: weapon.ap,
    cover: mods.cover,
  })

  // A torrent weapon makes no hit roll, so it can never score a Critical Hit.
  const pCrit =
    weapon.skill === 'torrent'
      ? 0
      : critProbability(weapon.skill, mods.hit ?? 0, mods.rerollHit)

  // Successful wounds produced by one attack, then unsaved wounds after the save.
  const wounds = woundsPerAttack(pHit, pCrit, pWound, weapon.keywords)
  const unsavedPerAttack = compoundBinomial(wounds, pFail)

  // Distribution over the number of unsaved wounds, accounting for a variable attack count.
  const attacks = diceDistribution(weapon.attacks)
  const unsavedWounds = compoundSum(attacks, unsavedPerAttack)

  // Damage carried by a single unsaved wound, after Feel No Pain.
  const woundDamage = applyFeelNoPain(
    diceDistribution(weapon.damage),
    target.feelNoPain
  )

  // Total damage = the sum of `unsavedWounds` independent wound-damage rolls.
  const damageDistribution = compoundSum(unsavedWounds, woundDamage)

  return {
    damageDistribution,
    mean: mean(damageDistribution),
    variance: variance(damageDistribution),
    probAtLeast: (x) => probAtLeast(damageDistribution, x),
    percentile: (p) => percentile(damageDistribution, p),
  }
}

/**
 * The distribution of successful wounds produced by a single attack.
 *
 * An attack misses, hits normally (and rolls to wound), or scores a Critical Hit.
 * A critical scores `1 + X` hits under Sustained Hits X; under Lethal Hits the
 * critting hit wounds automatically, while Sustained Hits' extra hits still roll
 * to wound as normal.
 */
function woundsPerAttack(
  pHit: number,
  pCrit: number,
  pWound: number,
  keywords: WeaponKeywords = {}
): Distribution {
  const sustained = keywords.sustainedHits ?? 0
  const critWounds = keywords.lethalHits
    ? shift(binomial(sustained, pWound), 1) // 1 automatic wound + X rolled
    : binomial(1 + sustained, pWound)

  return mix([
    [1 - pHit, point(0)],
    [pHit - pCrit, binomial(1, pWound)],
    [pCrit, critWounds],
  ])
}

/** The weighted mixture of distributions: `Σ weightᵢ · distᵢ`. */
function mix(parts: ReadonlyArray<[number, Distribution]>): Distribution {
  const out: number[] = []
  for (const [weight, dist] of parts) {
    if (!weight) continue
    for (let k = 0; k < dist.length; k++) {
      out[k] = (out[k] ?? 0) + weight * dist[k]
    }
  }
  return out.length > 0 ? out : point(0)
}

/**
 * The distribution of successes when the number of trials is itself random: sums
 * `Binomial(n, p)` weighted by `P(trials = n)`.
 */
function compoundBinomial(trials: Distribution, p: number): Distribution {
  const out: number[] = []
  for (let n = 0; n < trials.length; n++) {
    const weight = trials[n]
    if (!weight) continue
    const b = binomial(n, p)
    for (let k = 0; k < b.length; k++) {
      out[k] = (out[k] ?? 0) + weight * b[k]
    }
  }
  return out.length > 0 ? out : point(0)
}

/**
 * The distribution of the sum of `count` independent draws from `term`, where `count`
 * is itself a distribution. Builds the n-fold convolution incrementally.
 */
function compoundSum(count: Distribution, term: Distribution): Distribution {
  const out: number[] = []
  let nFold: Distribution = point(0) // the 0-fold sum is exactly 0
  for (let n = 0; n < count.length; n++) {
    const weight = count[n]
    if (weight) {
      for (let k = 0; k < nFold.length; k++) {
        out[k] = (out[k] ?? 0) + weight * nFold[k]
      }
    }
    nFold = convolve(nFold, term)
  }
  return out.length > 0 ? out : point(0)
}

/**
 * Apply Feel No Pain to a single wound's damage: each point of damage is independently
 * ignored on a `feelNoPain`+ roll, so the surviving damage is `Binomial(d, survive)`.
 */
function applyFeelNoPain(
  damage: Distribution,
  feelNoPain?: number
): Distribution {
  if (feelNoPain === undefined) return damage

  const survive = 1 - atLeastOnD6(feelNoPain)
  const out: number[] = []
  for (let d = 0; d < damage.length; d++) {
    const weight = damage[d]
    if (!weight) continue
    const b = binomial(d, survive)
    for (let k = 0; k < b.length; k++) {
      out[k] = (out[k] ?? 0) + weight * b[k]
    }
  }
  return out.length > 0 ? out : point(0)
}
