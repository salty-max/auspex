import { catalogueMeta, importCatalogue } from '@auspex/importer'
import type { Database } from 'bun:sqlite'

import { type Provenance, writeDatasheets, writeProvenance } from './db'
import { applyOverrides, type Override } from './overrides'

/** One catalogue to bake, with its libraries and hand-edited overrides. */
export interface BakeInput {
  /** Raw `.cat` XML content. */
  xml: string
  /** Library catalogues the faction's links resolve against. */
  libraries?: string[]
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
  const { datasheets, issues } = importCatalogue(
    input.xml,
    input.libraries ?? []
  )
  const faction = catalogueMeta(input.xml).faction

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

/**
 * Bake a whole set of catalogues in one pass. Each catalogue's dependency closure
 * (its `catalogueLink`s, transitively) is resolved from the set and handed to the
 * import as libraries, so thin factions find their units. Library catalogues are
 * link pools, not rosters — they are not baked as factions of their own.
 */
export function bakeAll(db: Database, catalogues: BakeInput[]): BakeReport[] {
  const entries = catalogues.map((input) => ({
    input,
    meta: catalogueMeta(input.xml),
  }))
  const byId = new Map(entries.map((entry) => [entry.meta.id, entry]))

  const reports: BakeReport[] = []
  for (const entry of entries) {
    if (entry.meta.isLibrary) continue

    const libraries = [...dependencyClosure(entry.meta.id, byId)]
      .map((id) => byId.get(id)?.input.xml)
      .filter((xml): xml is string => xml !== undefined)

    reports.push(
      bakeCatalogue(db, {
        xml: entry.input.xml,
        libraries,
        ...(entry.input.overrides && { overrides: entry.input.overrides }),
      })
    )
  }
  return reports
}

/** The transitive set of catalogue ids a root depends on, excluding itself. */
function dependencyClosure(
  rootId: string,
  byId: Map<string, { meta: { dependencies: string[] } }>
): Set<string> {
  const closure = new Set<string>()
  const stack = [...(byId.get(rootId)?.meta.dependencies ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()
    if (id === undefined || closure.has(id)) continue
    closure.add(id)
    stack.push(...(byId.get(id)?.meta.dependencies ?? []))
  }
  closure.delete(rootId)
  return closure
}

/** Stamp the artifact with where its data came from. */
export function stampProvenance(db: Database, provenance: Provenance): void {
  writeProvenance(db, provenance)
}
