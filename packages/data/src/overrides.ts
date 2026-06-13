import {
  type Datasheet,
  datasheetSchema,
  weaponProfileSchema,
} from '@auspex/schema'
import { z } from 'zod'

/**
 * One hand-edited patch applied at bake time: fix a BSData typo, add a weapon
 * the importer had to drop, or set a stat the catalogue does not carry.
 */
export const overrideSchema = z.object({
  /** The datasheet id (slug) the patch targets. */
  datasheet: z.string().min(1),
  /** A note explaining why the override exists (shows up in bake logs). */
  reason: z.string().min(1),
  /** Deep-merged into the datasheet (objects merge, scalars and arrays replace). */
  set: z.record(z.string(), z.unknown()).optional(),
  /** Weapon profiles to add, replacing any existing weapon of the same name. */
  addWeapons: z.array(weaponProfileSchema).optional(),
})

export const overridesFileSchema = z.array(overrideSchema)

export type Override = z.infer<typeof overrideSchema>

/** The outcome of applying one overrides file to one faction's datasheets. */
export interface OverrideReport {
  applied: number
  /** Overrides whose datasheet was not found — the bake fails on these. */
  unmatched: Override[]
}

function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key]
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current)
    ) {
      out[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Apply overrides to the imported datasheets, in place of the original entries.
 * Every patched datasheet is re-validated — an override that produces an invalid
 * datasheet throws, so a bad patch can never reach the artifact.
 */
export function applyOverrides(
  datasheets: Datasheet[],
  overrides: Override[]
): { datasheets: Datasheet[]; report: OverrideReport } {
  const byId = new Map(datasheets.map((sheet) => [sheet.id, sheet]))
  const unmatched: Override[] = []
  let applied = 0

  for (const override of overrides) {
    const sheet = byId.get(override.datasheet)
    if (!sheet) {
      unmatched.push(override)
      continue
    }

    let candidate: Record<string, unknown> = { ...sheet }
    if (override.set) {
      candidate = deepMerge(candidate, override.set)
    }
    if (override.addWeapons) {
      // Replace-or-append by name, so a patch is idempotent even once the
      // importer learns to parse the weapon the override was added to fix.
      const patched = new Map(
        (candidate.weapons as { name: string }[]).map((w) => [w.name, w])
      )
      for (const weapon of override.addWeapons) patched.set(weapon.name, weapon)
      candidate.weapons = [...patched.values()]
    }

    const parsed = datasheetSchema.safeParse(candidate)
    if (!parsed.success) {
      throw new Error(
        `override for "${override.datasheet}" (${override.reason}) produces an invalid datasheet: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`
      )
    }
    byId.set(sheet.id, parsed.data)
    applied++
  }

  return { datasheets: [...byId.values()], report: { applied, unmatched } }
}
