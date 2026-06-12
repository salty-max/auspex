import { diceDistribution, type DiceExpr } from '@auspex/engine'
import { z } from 'zod'

/**
 * A dice expression as the engine accepts it: a non-negative integer or a
 * `[count]D<sides>[±modifier]` string. Validated by actually resolving it with
 * the engine's parser, so the schema can never accept what the engine rejects.
 */
export const diceExprSchema: z.ZodType<DiceExpr> = z
  .union([z.int().nonnegative(), z.string()])
  .refine(
    (value) => {
      try {
        diceDistribution(value)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid dice expression' }
  )

/** The N+ value of a d6 roll characteristic (2+ to 6+). */
const rollThreshold = z.int().min(2).max(6)

/** Weapon abilities that alter the attack sequence. */
export const weaponAbilitiesSchema = z.object({
  /** Sustained Hits X: a Critical Hit scores `x` additional hits. */
  sustainedHits: z.int().positive().optional(),
  /** Lethal Hits: a Critical Hit automatically wounds. */
  lethalHits: z.boolean().optional(),
  /** Devastating Wounds: a Critical Wound allows no saving throw. */
  devastatingWounds: z.boolean().optional(),
  /** Blast: +1 attack per five models in the target unit. */
  blast: z.boolean().optional(),
  /** Rapid Fire X: +`x` attacks within half range. */
  rapidFire: z.int().positive().optional(),
  /** Melta X: +`x` damage within half range. */
  melta: z.int().positive().optional(),
  /** Anti-KEYWORD X+: Critical Wounds on `threshold`+ against matching targets. */
  anti: z
    .object({
      keyword: z.string().min(1),
      threshold: rollThreshold,
    })
    .optional(),
  /** Abilities the model does not interpret (kept verbatim for display). */
  other: z.array(z.string()).default([]),
})

/** One weapon profile as printed on a datasheet. */
export const weaponProfileSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['ranged', 'melee']),
  /** Range in inches; melee profiles have none. */
  range: z.int().positive().optional(),
  attacks: diceExprSchema,
  /** Ballistic/Weapon Skill as the N+ to hit; `'torrent'` auto-hits. */
  skill: z.union([z.literal('torrent'), rollThreshold]),
  strength: z.int().positive(),
  /** Armour penetration as a non-negative number (`2` means AP -2). */
  ap: z.int().nonnegative(),
  damage: diceExprSchema,
  abilities: weaponAbilitiesSchema.default({ other: [] }),
})

/** A datasheet ability (kept verbatim — rules text is for humans). */
export const abilitySchema = z.object({
  name: z.string().min(1),
  description: z.string(),
})

/** Points cost for one allowed unit size. */
export const unitPointsSchema = z.object({
  models: z.int().positive(),
  points: z.int().nonnegative(),
})

/** The defensive statline shared by every model on the datasheet. */
export const modelStatsSchema = z.object({
  movement: z.int().nonnegative().optional(),
  toughness: z.int().positive(),
  /** Armour save, the N+ value (7 means no save can succeed). */
  save: z.int().min(2).max(7),
  invuln: rollThreshold.optional(),
  feelNoPain: rollThreshold.optional(),
  wounds: z.int().positive(),
  leadership: z.int().positive().optional(),
  objectiveControl: z.int().nonnegative().optional(),
})

/** A normalized datasheet: one unit entry as printed, source-agnostic. */
export const datasheetSchema = z.object({
  /** Stable identifier, unique within a faction (slug, not display name). */
  id: z.string().min(1),
  name: z.string().min(1),
  faction: z.string().min(1),
  /** Faction and unit keywords (e.g. INFANTRY, VEHICLE, PSYKER). */
  keywords: z.array(z.string().min(1)).default([]),
  stats: modelStatsSchema,
  weapons: z.array(weaponProfileSchema).default([]),
  abilities: z.array(abilitySchema).default([]),
  /** Allowed unit sizes with their points costs. */
  points: z.array(unitPointsSchema).nonempty(),
})

export type WeaponAbilities = z.infer<typeof weaponAbilitiesSchema>
export type WeaponProfile = z.infer<typeof weaponProfileSchema>
export type Ability = z.infer<typeof abilitySchema>
export type UnitPoints = z.infer<typeof unitPointsSchema>
export type ModelStats = z.infer<typeof modelStatsSchema>
export type Datasheet = z.infer<typeof datasheetSchema>
