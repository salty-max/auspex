import type { DiceExpr } from '@auspex/engine'
import type { WeaponAbilities } from '@auspex/schema'

/**
 * Parse an `N+` roll characteristic (`"3+"` → 3). A bare integer (`"3"`) is a
 * common BSData typo for the same value — BS/WS/SV are always roll targets, so the
 * intent is unambiguous. The valid range (save 2..7, skill 2..6) is enforced by the
 * schema, so a save of `"7+"` (no armour save) stays parseable.
 */
export function parseRoll(raw: string): number | undefined {
  const match = /^(\d)\+?$/.exec(raw.trim())
  return match ? Number.parseInt(match[1], 10) : undefined
}

/** Parse an inches characteristic (`'30"'` → 30); `"Melee"` has none. */
export function parseInches(raw: string): number | undefined {
  const match = /^(\d+)"$/.exec(raw.trim())
  return match ? Number.parseInt(match[1], 10) : undefined
}

/** Parse a plain integer characteristic. */
export function parseInt10(raw: string): number | undefined {
  const match = /^-?\d+$/.exec(raw.trim())
  return match ? Number.parseInt(raw, 10) : undefined
}

/** Parse the AP characteristic: BSData prints `-1` for AP -1, `0` or `-` for none. */
export function parseAp(raw: string): number | undefined {
  if (raw.trim() === '-') return 0
  const value = parseInt10(raw)
  if (value === undefined || value > 0) return undefined
  return Math.abs(value)
}

/** Parse a dice-expression characteristic (`"D6+2"`, `"2"`, `"2D6"`). */
export function parseDice(raw: string): DiceExpr | undefined {
  const trimmed = raw.trim()
  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10)
  if (/^\d*d\d+(?:[+-]\d+)?$/i.test(trimmed)) return trimmed
  return undefined
}

/** The result of interpreting a weapon's Keywords characteristic. */
export interface ParsedKeywords {
  abilities: WeaponAbilities
  /** Whether the TORRENT keyword was present (drives `skill: 'torrent'`). */
  torrent: boolean
}

/**
 * Interpret the comma-separated Keywords characteristic. Everything the engine
 * understands maps to a structured ability; the rest is preserved verbatim in
 * `other` — never silently dropped.
 */
export function parseWeaponKeywords(raw: string): ParsedKeywords {
  const abilities: WeaponAbilities = { other: [] }
  let torrent = false

  const entries =
    raw.trim() === '-' || raw.trim() === ''
      ? []
      : raw.split(',').map((s) => s.trim())

  for (const entry of entries) {
    let match: RegExpExecArray | null
    if (/^torrent$/i.test(entry)) {
      torrent = true
    } else if (/^lethal hits$/i.test(entry)) {
      abilities.lethalHits = true
    } else if (/^devastating wounds$/i.test(entry)) {
      abilities.devastatingWounds = true
    } else if (/^blast$/i.test(entry)) {
      abilities.blast = true
    } else if ((match = /^sustained hits (\d+)$/i.exec(entry))) {
      abilities.sustainedHits = Number.parseInt(match[1], 10)
    } else if ((match = /^rapid fire (\d+)$/i.exec(entry))) {
      abilities.rapidFire = Number.parseInt(match[1], 10)
    } else if ((match = /^melta (\d+)$/i.exec(entry))) {
      abilities.melta = Number.parseInt(match[1], 10)
    } else if ((match = /^anti-(.+?) (\d)\+$/i.exec(entry))) {
      abilities.anti = {
        keyword: match[1].toUpperCase(),
        threshold: Number.parseInt(match[2], 10),
      }
    } else {
      abilities.other.push(entry)
    }
  }

  return { abilities, torrent }
}
