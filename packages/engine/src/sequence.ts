import { diceDistribution } from './dice'
import {
  binomial,
  convolve,
  type Distribution,
  mean,
  percentile,
  point,
  probAtLeast,
  variance,
} from './distribution'
import {
  atLeastOnD6,
  critProbability,
  hitProbability,
  saveFailProbability,
  woundProbability,
  woundThreshold,
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
 * Implemented keywords: Sustained Hits, Lethal Hits, Devastating Wounds.
 * Per-model overkill is layered on separately.
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
  // Critical Wounds are unaffected: the wound roll is always made.
  const pCrit =
    weapon.skill === 'torrent'
      ? 0
      : critProbability(weapon.skill, mods.hit ?? 0, mods.rerollHit)
  const pCritWound = critProbability(
    woundThreshold(weapon.strength, target.toughness),
    mods.wound ?? 0,
    mods.rerollWound
  )

  // Unsaved wounds carried by one attack.
  const perAttack = unsavedPerAttack(
    { pHit, pCrit, pWound, pCritWound, pFail },
    weapon.keywords
  )

  // Distribution over the number of unsaved wounds, accounting for a variable attack count.
  const attacks = diceDistribution(weapon.attacks)
  const unsavedWounds = compoundSum(attacks, perAttack)

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

/** The stage probabilities feeding the per-attack distribution. */
interface StageProbabilities {
  /** Probability one attack hits. */
  pHit: number
  /** Probability one attack scores a Critical Hit. */
  pCrit: number
  /** Probability one rolled wound roll succeeds. */
  pWound: number
  /** Probability one wound roll lands a Critical Wound. */
  pCritWound: number
  /** Probability the saving throw fails. */
  pFail: number
}

/**
 * The distribution of unsaved wounds produced by a single attack.
 *
 * An attack misses, hits normally (and rolls to wound), or scores a Critical Hit;
 * a critical scores `1 + X` hits under Sustained Hits X, and under Lethal Hits the
 * critting hit wounds automatically (Sustained Hits' extra hits still roll). Every
 * wound then takes the saving throw — except that under Devastating Wounds, the
 * Critical Wound slice of each rolled wound bypasses it entirely. The Lethal Hits
 * automatic wound never rolled, so it is never critical and always takes the save.
 */
function unsavedPerAttack(
  { pHit, pCrit, pWound, pCritWound, pFail }: StageProbabilities,
  keywords: WeaponKeywords = {}
): Distribution {
  const sustained = keywords.sustainedHits ?? 0

  // Probability one rolled wound ends unsaved.
  const u = keywords.devastatingWounds
    ? pCritWound + (pWound - pCritWound) * pFail
    : pWound * pFail

  const critSlice = keywords.lethalHits
    ? convolve(binomial(1, pFail), binomial(sustained, u)) // auto-wound + X rolled
    : binomial(1 + sustained, u)

  return mix([
    [1 - pHit, point(0)],
    [pHit - pCrit, binomial(1, u)],
    [pCrit, critSlice],
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
