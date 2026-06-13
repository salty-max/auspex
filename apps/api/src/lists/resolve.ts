import { datasheetSource } from '@auspex/data'
import { parseList } from '@auspex/dsl'
import { resolve, type ResolveDiagnostic } from '@auspex/resolver'
import type { Database } from 'bun:sqlite'

/** A resolved unit, trimmed to what the client needs (no full datasheet). */
export interface ResolvedUnitSummary {
  name: string
  models: number
  points: number
  datasheetId: string
}

/** A list's DSL resolved against the data: a costed army plus diagnostics. */
export interface ResolvedList {
  /** The costed army, or `null` when the DSL could not be parsed at all. */
  army: {
    totalPoints: number
    units: ResolvedUnitSummary[]
  } | null
  /** Parse and resolution diagnostics, source-mapped to the DSL. */
  diagnostics: ResolveDiagnostic[]
}

/**
 * Parse a list's DSL body and resolve it against the baked data. Parse failures
 * become error diagnostics with no army; a parsed list is resolved into a costed
 * army summary plus the resolver's diagnostics.
 */
export function resolveBody(body: string, data: Database): ResolvedList {
  const { list, errors } = parseList(body)

  if (!list) {
    return {
      army: null,
      diagnostics: errors.map((error) => ({
        severity: 'error',
        message: error.message,
        line: error.line,
        column: error.column,
      })),
    }
  }

  const army = resolve(list, datasheetSource(data))
  return {
    army: {
      totalPoints: army.totalPoints,
      units: army.units.map((unit) => ({
        name: unit.entry.name,
        models: unit.models,
        points: unit.points,
        datasheetId: unit.datasheet.id,
      })),
    },
    diagnostics: army.diagnostics,
  }
}
