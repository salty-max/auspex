import type { DiceExpr } from './dice'
import type { Distribution } from './distribution'
import type { Reroll } from './rules'

/** Weapon abilities ("keywords") that alter the attack sequence. */
export interface WeaponKeywords {
  /** Sustained Hits X: a Critical Hit scores `x` additional hits. */
  sustainedHits?: number
  /** Lethal Hits: a Critical Hit automatically wounds the target. */
  lethalHits?: boolean
  /** Devastating Wounds: a Critical Wound allows no saving throw of any kind. */
  devastatingWounds?: boolean
}

/** A weapon profile being resolved against a target. */
export interface Weapon {
  /** Number of attacks (Attacks characteristic). */
  attacks: DiceExpr
  /** Ballistic/Weapon Skill, as the N+ required to hit. `'torrent'` auto-hits. */
  skill: number | 'torrent'
  /** Strength characteristic. */
  strength: number
  /** Armour penetration as a positive number (e.g. `2` means AP -2). */
  ap: number
  /** Damage characteristic. */
  damage: DiceExpr
  /** Weapon abilities altering the attack sequence, if any. */
  keywords?: WeaponKeywords
}

/** The unit being attacked. */
export interface Target {
  /** Toughness characteristic. */
  toughness: number
  /** Armour save, the N+ value. */
  save: number
  /** Invulnerable save, the N+ value, if any. */
  invuln?: number
  /** Feel No Pain, the N+ value, if any. */
  feelNoPain?: number
  /** Wounds characteristic of a single model. */
  wounds: number
  /** Number of models in the unit. */
  models: number
}

/** Optional situational modifiers applied to the exchange. */
export interface Modifiers {
  /** Net modifier to the hit roll; values beyond ±1 are clamped. */
  hit?: number
  /** Net modifier to the wound roll; values beyond ±1 are clamped. */
  wound?: number
  /** Re-roll allowance on the hit roll. Ignored for torrent weapons (no hit roll). */
  rerollHit?: Reroll
  /** Re-roll allowance on the wound roll. */
  rerollWound?: Reroll
  /** Whether the target has the Benefit of Cover (ranged attacks only). */
  cover?: boolean
}

/** The result of resolving a weapon against a target. */
export interface SimResult {
  /**
   * The distribution of damage actually inflicted on the unit (post-save,
   * post-FNP). Excess damage past a slain model is lost, so the support is
   * bounded by `wounds × models`.
   */
  damageDistribution: Distribution
  /** The distribution of the number of models slain (support `0..models`). */
  modelsSlainDistribution: Distribution
  /** Expected number of models slain. */
  meanModelsSlain: number
  /** The probability that the whole unit is destroyed. */
  probWipes: number
  /** The probability of slaying at least `n` models. */
  probKillsAtLeast(n: number): number
  /** Expected (mean) damage dealt. */
  mean: number
  /** Variance of the damage dealt. */
  variance: number
  /** The probability of dealing at least `x` damage. */
  probAtLeast(x: number): number
  /** The `p`-quantile of damage dealt (e.g. `0.5` for the median). */
  percentile(p: number): number
}
