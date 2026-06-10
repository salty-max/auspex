/**
 * Pure 10th-edition rule helpers. Everything here is a small, individually testable
 * function so the probabilities feeding the engine can be verified in isolation.
 */

/**
 * A re-roll allowance on a hit or wound roll: `'ones'` re-rolls unmodified 1s,
 * `'full'` re-rolls any die. Each die is re-rolled at most once.
 */
export type Reroll = 'ones' | 'full'

/**
 * The probability that one d6 (rolled once, no re-roll) of `threshold`+ succeeds,
 * honouring the "unmodified 1 always fails, unmodified 6 always succeeds" convention
 * used for hit and wound rolls. The net modifier is clamped to ±1.
 */
function singleRollProbability(threshold: number, modifier: number): number {
  const mod = Math.max(-1, Math.min(1, modifier))
  let successes = 0
  for (let face = 1; face <= 6; face++) {
    if (face === 1) continue // unmodified 1 always fails
    if (face === 6) {
      successes++ // unmodified 6 always succeeds
      continue
    }
    if (face + mod >= threshold) successes++
  }
  return successes / 6
}

/**
 * The probability that a hit/wound-style d6 roll of `threshold`+ succeeds, with a
 * `modifier` applied to the rolled value (net clamp ±1) and an optional re-roll.
 *
 * Re-rolls assume rational play: under `'ones'` the unmodified 1 (always a failure)
 * is re-rolled, under `'full'` exactly the dice that would fail after modifiers are
 * re-rolled. The re-rolled die takes the same modifier and is never re-rolled again.
 */
export function rollProbability(
  threshold: number,
  modifier = 0,
  reroll?: Reroll
): number {
  const p = singleRollProbability(threshold, modifier)
  if (reroll === 'ones') return p + p / 6
  if (reroll === 'full') return p + (1 - p) * p
  return p
}

/**
 * The probability that a hit/wound-style roll lands a critical — an unmodified 6
 * after any re-roll. Re-rolled dice (unmodified 1s for `'ones'`, would-be failures
 * for `'full'`) show a 6 with probability 1/6, raising the critical chance.
 */
export function critProbability(
  threshold: number,
  modifier = 0,
  reroll?: Reroll
): number {
  if (reroll === 'ones') return 1 / 6 + 1 / 36
  if (reroll === 'full') {
    const p = singleRollProbability(threshold, modifier)
    return 1 / 6 + (1 - p) / 6
  }
  return 1 / 6
}

/** The probability that a single d6 simply shows `threshold` or higher (no auto rules). */
export function atLeastOnD6(threshold: number): number {
  if (threshold <= 1) return 1
  if (threshold > 6) return 0
  return (7 - threshold) / 6
}

/** Probability that one attack hits, given the weapon's skill (BS/WS), a hit modifier and an optional re-roll. */
export function hitProbability(
  skill: number,
  hitModifier = 0,
  reroll?: Reroll
): number {
  return rollProbability(skill, hitModifier, reroll)
}

/**
 * The roll required to wound, from the strength-versus-toughness comparison (10e chart):
 *
 * - S ≥ 2×T → 2+
 * - S  >  T → 3+
 * - S  =  T → 4+
 * - ½T < S < T → 5+
 * - S ≤ ½T → 6+
 */
export function woundThreshold(strength: number, toughness: number): number {
  if (strength >= 2 * toughness) return 2
  if (strength > toughness) return 3
  if (strength === toughness) return 4
  if (2 * strength <= toughness) return 6
  return 5
}

/** Probability that one hit wounds, given strength, toughness, a wound modifier and an optional re-roll. */
export function woundProbability(
  strength: number,
  toughness: number,
  woundModifier = 0,
  reroll?: Reroll
): number {
  return rollProbability(
    woundThreshold(strength, toughness),
    woundModifier,
    reroll
  )
}

/** Inputs controlling the saving throw. */
export interface SaveContext {
  /** Armour save, the N+ value. */
  save: number
  /** Invulnerable save, the N+ value, if any. */
  invuln?: number
  /** Weapon armour penetration as a positive number (e.g. `2` means AP -2). */
  ap: number
  /** Whether the target benefits from cover. */
  cover?: boolean
}

/**
 * The probability that a saving throw *fails* — i.e. the wound goes through.
 *
 * The model uses the better of its (AP-modified, cover-improved) armour save and its
 * invulnerable save. Cover cannot improve an armour save that is already 3+ or better
 * against an AP 0 attack.
 */
export function saveFailProbability({
  save,
  invuln,
  ap,
  cover = false,
}: SaveContext): number {
  let armour = save + ap
  if (cover && !(ap === 0 && save <= 3)) {
    armour -= 1
  }

  const best = invuln === undefined ? armour : Math.min(armour, invuln)

  let saves = 0
  for (let face = 2; face <= 6; face++) {
    if (face >= best) saves++ // a natural 1 always fails the save
  }
  return 1 - saves / 6
}
