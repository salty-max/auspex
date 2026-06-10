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
  hitProbability,
  saveFailProbability,
  woundProbability,
} from './rules'
import type { Modifiers, SimResult, Target, Weapon } from './types'

/**
 * Resolve a weapon against a target and return the exact distribution of damage dealt.
 *
 * The attack sequence is composed stage by stage as a transformation of probability
 * distributions: number of attacks → hits → wounds → unsaved wounds → damage → Feel No
 * Pain. No dice are rolled — the result is the exact distribution, identical on every run.
 *
 * This is the base sequence: weapon keywords (Sustained/Lethal/Devastating Wounds, …)
 * and per-model overkill are layered on separately.
 */
export function simulate(
  weapon: Weapon,
  target: Target,
  mods: Modifiers = {}
): SimResult {
  const pHit =
    weapon.skill === 'torrent' ? 1 : hitProbability(weapon.skill, mods.hit ?? 0)
  const pWound = woundProbability(
    weapon.strength,
    target.toughness,
    mods.wound ?? 0
  )
  const pFail = saveFailProbability({
    save: target.save,
    invuln: target.invuln,
    ap: weapon.ap,
    cover: mods.cover,
  })

  // Probability a single attack ends as an unsaved wound.
  const pUnsaved = pHit * pWound * pFail

  // Distribution over the number of unsaved wounds, accounting for a variable attack count.
  const attacks = diceDistribution(weapon.attacks)
  const unsavedWounds = compoundBinomial(attacks, pUnsaved)

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
