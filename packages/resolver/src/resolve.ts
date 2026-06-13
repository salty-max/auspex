import type { ArmyList, UnitEntry } from '@auspex/dsl'
import type { Datasheet } from '@auspex/schema'

/** Look a datasheet up by faction and name; `undefined` when unknown. */
export type DatasheetSource = (
  faction: string,
  name: string
) => Datasheet | undefined

/** The severity of a resolution diagnostic. */
export type Severity = 'error' | 'warning'

/** A resolution diagnostic, source-mapped to the unit's line when one applies. */
export interface ResolveDiagnostic {
  severity: Severity
  message: string
  /** 1-based line of the offending unit, when the diagnostic is unit-scoped. */
  line?: number
  /** 1-based column of the offending unit. */
  column?: number
}

/** A unit successfully bound to its datasheet. */
export interface ResolvedUnit {
  /** The original parsed entry. */
  entry: UnitEntry
  /** The datasheet the unit's name resolved to. */
  datasheet: Datasheet
  /** The number of models, from the entry. */
  models: number
  /** The unit's points — the datasheet's cost for this size when known. */
  points: number
}

/** A list bound to datasheets, costed, with diagnostics. */
export interface ResolvedArmy {
  name: string
  faction: string
  detachment?: string
  pointsLimit?: number
  /** Only units whose names resolved. */
  units: ResolvedUnit[]
  /** Sum of the resolved units' points. */
  totalPoints: number
  diagnostics: ResolveDiagnostic[]
}

/**
 * Bind a parsed list to real datasheets, cost it, and check the list-level rules.
 *
 * Each unit name is looked up through `source`; an unresolved name is an error
 * pinned to the unit's line. Points come from the datasheet's bracket for the
 * declared model count — a declared `@points` that disagrees is a warning, and a
 * model count the datasheet has no bracket for falls back to the declared points
 * with a warning. The army must field exactly one warlord and stay within its
 * points limit. Wargear legality is out of scope — options are carried through.
 */
export function resolve(list: ArmyList, source: DatasheetSource): ResolvedArmy {
  const diagnostics: ResolveDiagnostic[] = []
  const units: ResolvedUnit[] = []
  let warlords = 0

  for (const entry of list.units) {
    if (entry.warlord) warlords++

    const datasheet = source(list.faction, entry.name)
    if (!datasheet) {
      diagnostics.push({
        severity: 'error',
        message: `unknown datasheet "${entry.name}" in ${list.faction}`,
        line: entry.position.line,
        column: entry.position.column,
      })
      continue
    }

    units.push({
      entry,
      datasheet,
      models: entry.models,
      points: costUnit(entry, datasheet, diagnostics),
    })
  }

  if (warlords === 0) {
    diagnostics.push({ severity: 'warning', message: 'no warlord declared' })
  } else if (warlords > 1) {
    diagnostics.push({
      severity: 'warning',
      message: `${warlords} warlords declared (expected exactly 1)`,
    })
  }

  const totalPoints = units.reduce((sum, unit) => sum + unit.points, 0)
  if (list.pointsLimit !== undefined && totalPoints > list.pointsLimit) {
    diagnostics.push({
      severity: 'error',
      message: `army is ${totalPoints} points, over the ${list.pointsLimit} limit`,
    })
  }

  return {
    name: list.name,
    faction: list.faction,
    ...(list.detachment !== undefined && { detachment: list.detachment }),
    ...(list.pointsLimit !== undefined && { pointsLimit: list.pointsLimit }),
    units,
    totalPoints,
    diagnostics,
  }
}

/** The points for one unit, with diagnostics for size and declared-cost mismatches. */
function costUnit(
  entry: UnitEntry,
  datasheet: Datasheet,
  diagnostics: ResolveDiagnostic[]
): number {
  const bracket = datasheet.points.find((p) => p.models === entry.models)

  if (!bracket) {
    const sizes = datasheet.points.map((p) => p.models).join(', ')
    diagnostics.push({
      severity: 'warning',
      message: `${entry.name}: no ${entry.models}-model size (have ${sizes}); using declared points`,
      line: entry.position.line,
      column: entry.position.column,
    })
    return entry.points ?? 0
  }

  if (entry.points !== undefined && entry.points !== bracket.points) {
    diagnostics.push({
      severity: 'warning',
      message: `${entry.name}: declared @${entry.points} but ${entry.models} models cost ${bracket.points}`,
      line: entry.position.line,
      column: entry.position.column,
    })
  }

  return bracket.points
}
