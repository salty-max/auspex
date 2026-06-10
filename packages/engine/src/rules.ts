/**
 * Pure 10th-edition rule helpers. Everything here is a small, individually testable
 * function so the probabilities feeding the engine can be verified in isolation.
 */

/**
 * The probability that a single d6 roll of `threshold`+ succeeds, honouring the
 * "unmodified 1 always fails, unmodified 6 always succeeds" convention used for hit
 * and wound rolls. A `modifier` is applied to the rolled value; hit and wound rolls
 * can never be modified by more than ±1, so the net modifier is clamped.
 */
export function rollProbability(threshold: number, modifier = 0): number {
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

/** The probability that a single d6 simply shows `threshold` or higher (no auto rules). */
export function atLeastOnD6(threshold: number): number {
  if (threshold <= 1) return 1
  if (threshold > 6) return 0
  return (7 - threshold) / 6
}

/** Probability that one attack hits, given the weapon's skill (BS/WS) and a hit modifier. */
export function hitProbability(skill: number, hitModifier = 0): number {
  return rollProbability(skill, hitModifier)
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

/** Probability that one hit wounds, given strength, toughness and a wound modifier. */
export function woundProbability(strength: number, toughness: number, woundModifier = 0): number {
  return rollProbability(woundThreshold(strength, toughness), woundModifier)
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
export function saveFailProbability({ save, invuln, ap, cover = false }: SaveContext): number {
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
