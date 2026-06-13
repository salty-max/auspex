/** A 1-based position in the source text, for diagnostics. */
export interface SourcePosition {
  /** 1-based line number. */
  line: number
  /** 1-based column number. */
  column: number
}

/** A wargear or enhancement choice on a unit (unresolved — just text and a count). */
export interface UnitOption {
  /** The option name as written (e.g. `"Plasma pistol"`). */
  name: string
  /** How many of this option; defaults to 1. */
  count: number
}

/** One unit entry in a list (the datasheet name is unresolved). */
export interface UnitEntry {
  /** The datasheet name as written. */
  name: string
  /** Number of models in the unit; defaults to 1. */
  models: number
  /** The points the author declared with `@`, if any (verified later). */
  points?: number
  /** Whether the unit was marked as the warlord. */
  warlord: boolean
  /** Wargear and enhancement choices. */
  options: UnitOption[]
  /** Where the entry begins, for diagnostics. */
  position: SourcePosition
}

/** A parsed army list. */
export interface ArmyList {
  /** The list's name. */
  name: string
  /** The army's faction. */
  faction: string
  /** The detachment, if declared. */
  detachment?: string
  /** The points limit, if declared. */
  pointsLimit?: number
  /** The unit entries, in source order. */
  units: UnitEntry[]
}

/** A source-mapped parse diagnostic. */
export interface DslError {
  message: string
  line: number
  column: number
}

/** The outcome of parsing a list file: a list when usable, plus any diagnostics. */
export interface ParseListResult {
  /** The parsed list, or `undefined` when a required header is missing. */
  list?: ArmyList
  /** Diagnostics; an empty array means a clean parse. */
  errors: DslError[]
}
