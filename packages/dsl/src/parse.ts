import {
  char,
  coroutine,
  digits,
  endOfInput,
  optionalWhitespace,
  possibly,
  regex,
  sepBy,
  whitespace,
} from 'parsil'

import type {
  ArmyList,
  DslError,
  ParseListResult,
  UnitEntry,
  UnitOption,
} from './ast'

/** Trim and collapse internal whitespace runs — forgiving of mobile typing. */
function normalizeSpace(text: string): string {
  return text.trim().replaceAll(/\s+/g, ' ')
}

/** A `<count>x ` prefix → the count. Backtracks cleanly when absent (e.g. `10th`). */
const countPrefix = coroutine((run): number => {
  const d = run(digits)
  run(char('x'))
  run(whitespace)
  return Number.parseInt(d, 10)
})

/** One option: `[<count>x ]<name>`, read up to the next comma. */
const optionParser = coroutine((run): UnitOption => {
  run(optionalWhitespace)
  const count = run(possibly(countPrefix))
  const name = normalizeSpace(run(regex(/^[^,]+/)))
  return { name, count: count ?? 1 }
})

/** `@<points>` → the declared points. */
const pointsParser = coroutine((run): number => {
  run(char('@'))
  run(optionalWhitespace)
  const d = run(digits)
  run(optionalWhitespace)
  return Number.parseInt(d, 10)
})

/** `* <option>, <option>, …` → the option list. */
const optionsParser = coroutine((run): UnitOption[] => {
  run(char('*'))
  run(optionalWhitespace)
  return run(sepBy(char(','))(optionParser))
})

/** The raw shape a unit line parses into, before warlord extraction. */
interface RawUnit {
  models: number
  name: string
  points: number | null
  options: UnitOption[]
}

/** A whole unit line: `[<count>x ]<name>[ @<points>][ * <options>]`. */
const unitLineParser = coroutine((run): RawUnit => {
  run(optionalWhitespace)
  const models = run(possibly(countPrefix)) ?? 1
  const name = normalizeSpace(run(regex(/^[^@*]+/)))
  const points = run(possibly(pointsParser))
  const options = run(possibly(optionsParser)) ?? []
  run(optionalWhitespace)
  run(endOfInput)
  return { models, name, points, options }
})

/** A double-quoted string occupying the rest of the value. */
const quotedString = coroutine((run): string => {
  run(optionalWhitespace)
  run(char('"'))
  const s = run(regex(/^[^"]*/))
  run(char('"'))
  run(optionalWhitespace)
  run(endOfInput)
  return s
})

/** An integer occupying the rest of the value. */
const integerLine = coroutine((run): number => {
  run(optionalWhitespace)
  const d = run(digits)
  run(optionalWhitespace)
  run(endOfInput)
  return Number.parseInt(d, 10)
})

const HEADER_KEYWORDS = ['list', 'faction', 'detachment', 'points'] as const
const HEADER_RE = /^(\s*)(list|faction|detachment|points)(?:\s+|$)/

/** Strip a `#` comment, ignoring `#` inside a double-quoted span. */
function stripComment(line: string): string {
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuote = !inQuote
    else if (ch === '#' && !inQuote) return line.slice(0, i)
  }
  return line
}

/** The 1-based column of the first non-whitespace character. */
function firstColumn(line: string): number {
  return line.length - line.trimStart().length + 1
}

/**
 * Parse an army list. Blank lines and `#` comments are ignored; every other line
 * is a header or a unit. A line that fails to parse yields one source-mapped
 * diagnostic and parsing continues, so one bad line never hides the rest. The list
 * is returned only when both required headers (`list`, `faction`) are present.
 */
export function parseList(source: string): ParseListResult {
  const errors: DslError[] = []
  const units: UnitEntry[] = []
  const headers = new Map<string, string | number>()
  // Keywords that appeared at all (even with a bad value), so a malformed header
  // is not also reported as missing.
  const seen = new Set<string>()

  source.split(/\r?\n/).forEach((rawLine, i) => {
    const line = stripComment(rawLine)
    const lineNo = i + 1
    if (line.trim() === '') return

    const header = HEADER_RE.exec(line)
    if (header) {
      parseHeader(line, header, lineNo, headers, seen, errors)
    } else {
      parseUnit(line, lineNo, units, errors)
    }
  })

  for (const key of ['list', 'faction'] as const) {
    if (!seen.has(key)) {
      errors.push({ message: `missing "${key}" header`, line: 1, column: 1 })
    }
  }

  const name = headers.get('list')
  const faction = headers.get('faction')
  const list: ArmyList | undefined =
    typeof name === 'string' && typeof faction === 'string'
      ? {
          name,
          faction,
          ...(typeof headers.get('detachment') === 'string' && {
            detachment: headers.get('detachment') as string,
          }),
          ...(typeof headers.get('points') === 'number' && {
            pointsLimit: headers.get('points') as number,
          }),
          units,
        }
      : undefined

  return { list, errors }
}

function parseHeader(
  line: string,
  header: RegExpExecArray,
  lineNo: number,
  headers: Map<string, string | number>,
  seen: Set<string>,
  errors: DslError[]
): void {
  const keyword = header[2]
  const keywordColumn = header[1].length + 1
  const valueStart = header[0].length
  const rest = line.slice(valueStart)

  if (seen.has(keyword)) {
    errors.push({
      message: `duplicate "${keyword}" header`,
      line: lineNo,
      column: keywordColumn,
    })
    return
  }
  seen.add(keyword)

  if (keyword === 'list') {
    const result = quotedString.run(rest)
    if (result.isError) {
      errors.push({
        message: `"list" expects a quoted name`,
        line: lineNo,
        column: valueStart + result.error.index + 1,
      })
      return
    }
    headers.set(keyword, result.result)
  } else if (keyword === 'points') {
    const result = integerLine.run(rest)
    if (result.isError) {
      errors.push({
        message: `"points" expects an integer`,
        line: lineNo,
        column: valueStart + result.error.index + 1,
      })
      return
    }
    headers.set(keyword, result.result)
  } else {
    const value = normalizeSpace(rest)
    if (value === '') {
      errors.push({
        message: `"${keyword}" needs a value`,
        line: lineNo,
        column: keywordColumn,
      })
      return
    }
    headers.set(keyword, value)
  }
}

function parseUnit(
  line: string,
  lineNo: number,
  units: UnitEntry[],
  errors: DslError[]
): void {
  const result = unitLineParser.run(line)
  if (result.isError) {
    errors.push({
      message: `malformed unit: ${result.error.message}`,
      line: lineNo,
      column: result.error.index + 1,
    })
    return
  }

  const raw = result.result
  const options: UnitOption[] = []
  let warlord = false
  for (const option of raw.options) {
    if (option.count === 1 && /^warlord$/i.test(option.name)) {
      warlord = true
    } else {
      options.push(option)
    }
  }

  units.push({
    name: raw.name,
    models: raw.models,
    ...(raw.points !== null && { points: raw.points }),
    warlord,
    options,
    position: { line: lineNo, column: firstColumn(line) },
  })
}

/** The header keywords reserved at the start of a line. */
export const RESERVED_HEADERS: readonly string[] = HEADER_KEYWORDS
