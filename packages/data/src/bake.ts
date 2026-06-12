import { importCatalogue } from '@auspex/importer'
import type { Database } from 'bun:sqlite'

import { type Provenance, writeDatasheets, writeProvenance } from './db'
import { applyOverrides, type Override } from './overrides'

/** One catalogue to bake, with its hand-edited overrides. */
export interface BakeInput {
  /** Raw `.cat` XML content. */
  xml: string
  overrides?: Override[]
}

/** What one bake produced, per faction. */
export interface BakeReport {
  faction: string
  datasheets: number
  weapons: number
  issues: number
  overridesApplied: number
}

/**
 * Import a catalogue, apply its overrides, and write the result into the
 * artifact database. Unmatched overrides fail the bake loudly — a stale patch
 * must be removed, not ignored.
 */
export function bakeCatalogue(db: Database, input: BakeInput): BakeReport {
  const { datasheets, issues } = importCatalogue(input.xml)
  const faction = datasheets[0]?.faction ?? 'Unknown'

  const { datasheets: patched, report } = applyOverrides(
    datasheets,
    input.overrides ?? []
  )
  if (report.unmatched.length > 0) {
    throw new Error(
      `unmatched overrides for ${faction}: ${report.unmatched
        .map((override) => `${override.datasheet} (${override.reason})`)
        .join(', ')}`
    )
  }

  writeDatasheets(db, faction, patched)
  const insertIssue = db.prepare(
    'INSERT INTO issues (faction, entry, reason) VALUES (?, ?, ?)'
  )
  for (const issue of issues) {
    insertIssue.run(faction, issue.entry, issue.reason)
  }

  return {
    faction,
    datasheets: patched.length,
    weapons: patched.reduce((sum, sheet) => sum + sheet.weapons.length, 0),
    issues: issues.length,
    overridesApplied: report.applied,
  }
}

/** Stamp the artifact with where its data came from. */
export function stampProvenance(db: Database, provenance: Provenance): void {
  writeProvenance(db, provenance)
}
