import { convolve, die, type Distribution, point, shift } from './distribution'

/**
 * A dice expression as used throughout the game: either a fixed number, or a string of
 * the form `[count]D<sides>[±modifier]`.
 *
 * Examples: `3`, `"D6"`, `"2D3"`, `"D6+2"`, `"3D3-1"`.
 */
export type DiceExpr = number | string

const DICE_PATTERN = /^(\d*)[dD](\d+)([+-]\d+)?$/

/** Resolve a dice expression to the distribution of its outcome. */
export function diceDistribution(expr: DiceExpr): Distribution {
  if (typeof expr === 'number') return point(expr)

  const trimmed = expr.trim()
  if (/^\d+$/.test(trimmed)) return point(Number.parseInt(trimmed, 10))

  const match = DICE_PATTERN.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid dice expression: "${expr}"`)
  }

  const count = match[1] === '' ? 1 : Number.parseInt(match[1], 10)
  const sides = Number.parseInt(match[2], 10)
  const modifier = match[3] ? Number.parseInt(match[3], 10) : 0

  let dist = point(0)
  for (let i = 0; i < count; i++) {
    dist = convolve(dist, die(sides))
  }
  return modifier === 0 ? dist : shift(dist, modifier)
}
