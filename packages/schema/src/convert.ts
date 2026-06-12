import type { Target, Weapon, WeaponKeywords } from '@auspex/engine'

import type { Datasheet, WeaponProfile } from './datasheet'

/**
 * Convert a weapon profile into the engine's `Weapon`, losslessly: every field
 * the engine resolves is carried over. The Anti keyword string stays behind —
 * matching it against the target is the caller's job (`Modifiers.antiActive`).
 */
export function toEngineWeapon(profile: WeaponProfile): Weapon {
  const a = profile.abilities
  const keywords: WeaponKeywords = {
    ...(a.sustainedHits !== undefined && { sustainedHits: a.sustainedHits }),
    ...(a.lethalHits && { lethalHits: true }),
    ...(a.devastatingWounds && { devastatingWounds: true }),
    ...(a.blast && { blast: true }),
    ...(a.rapidFire !== undefined && { rapidFire: a.rapidFire }),
    ...(a.melta !== undefined && { melta: a.melta }),
    ...(a.anti !== undefined && { anti: a.anti.threshold }),
  }

  return {
    kind: profile.kind,
    attacks: profile.attacks,
    skill: profile.skill,
    strength: profile.strength,
    ap: profile.ap,
    damage: profile.damage,
    ...(Object.keys(keywords).length > 0 && { keywords }),
  }
}

/**
 * Convert a datasheet into the engine's `Target` for a unit of `models` models.
 * The size must be one the datasheet allows.
 */
export function toEngineTarget(sheet: Datasheet, models: number): Target {
  if (!sheet.points.some((p) => p.models === models)) {
    throw new Error(
      `${sheet.id} has no ${models}-model unit size (allowed: ${sheet.points
        .map((p) => p.models)
        .join(', ')})`
    )
  }

  return {
    toughness: sheet.stats.toughness,
    save: sheet.stats.save,
    ...(sheet.stats.invuln !== undefined && { invuln: sheet.stats.invuln }),
    ...(sheet.stats.feelNoPain !== undefined && {
      feelNoPain: sheet.stats.feelNoPain,
    }),
    wounds: sheet.stats.wounds,
    models,
  }
}
