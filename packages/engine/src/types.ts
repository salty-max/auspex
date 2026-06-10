import type { DiceExpr } from './dice'
import type { Distribution } from './distribution'

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
  /** Whether the target has the Benefit of Cover (ranged attacks only). */
  cover?: boolean
}

/** The result of resolving a weapon against a target. */
export interface SimResult {
  /** The full distribution of total damage dealt to the unit (post-save, post-FNP). */
  damageDistribution: Distribution
  /** Expected (mean) damage dealt. */
  mean: number
  /** Variance of the damage dealt. */
  variance: number
  /** The probability of dealing at least `x` damage. */
  probAtLeast(x: number): number
  /** The `p`-quantile of damage dealt (e.g. `0.5` for the median). */
  percentile(p: number): number
}
