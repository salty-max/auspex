import {
  diceDistribution,
  type SimResult,
  simulate,
  type Target,
  type Weapon,
} from '@auspex/engine'

/** The weapon side of the matchup, kept as raw strings so fields edit freely. */
export interface WeaponForm {
  attacks: string
  skill: number
  strength: string
  ap: number
  damage: string
}

/** The target side of the matchup. */
export interface TargetForm {
  toughness: number
  save: number
  wounds: number
  models: number
}

/** Ten bolters into a five-model Marine squad — the engine's canonical example. */
export const DEFAULT_WEAPON: WeaponForm = {
  attacks: '10',
  skill: 3,
  strength: '4',
  ap: 0,
  damage: '1',
}

/** The default target paired with `DEFAULT_WEAPON`. */
export const DEFAULT_TARGET: TargetForm = {
  toughness: 4,
  save: 3,
  wounds: 2,
  models: 5,
}

/** A computed simulation, or the parse error that blocked it. */
export type SimState =
  | { ok: true; result: SimResult }
  | { ok: false; error: string }

/** Round and constrain a field value to an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Whether a dice expression fails to parse. */
export function isInvalidDice(expr: string): boolean {
  try {
    diceDistribution(expr)
    return false
  } catch {
    return true
  }
}

/** Run the matchup through the engine, surfacing any parse error. */
export function runSimulation(
  weapon: WeaponForm,
  target: TargetForm
): SimState {
  try {
    const w: Weapon = {
      attacks: weapon.attacks,
      skill: weapon.skill,
      strength: weapon.strength,
      ap: weapon.ap,
      damage: weapon.damage,
    }
    const t: Target = {
      toughness: target.toughness,
      save: target.save,
      wounds: target.wounds,
      models: target.models,
    }
    return { ok: true, result: simulate(w, t) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid profile',
    }
  }
}

/** Format a probability in [0, 1] as a whole-number percentage. */
export function percent(p: number): string {
  return `${(p * 100).toFixed(0)}%`
}
