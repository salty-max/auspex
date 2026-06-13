import { describe, expect, test } from 'bun:test'

import {
  datasheetSchema,
  diceExprSchema,
  weaponProfileSchema,
} from '../src/datasheet'

const bolter = {
  name: 'Bolt rifle',
  kind: 'ranged',
  range: 24,
  attacks: 2,
  skill: 3,
  strength: 4,
  ap: 1,
  damage: 1,
}

const intercessors = {
  id: 'intercessor-squad',
  name: 'Intercessor Squad',
  faction: 'Space Marines',
  keywords: ['INFANTRY', 'IMPERIUM'],
  stats: { toughness: 4, save: 3, wounds: 2 },
  weapons: [bolter],
  abilities: [{ name: 'Oath of Moment', description: 'Re-roll Hit rolls.' }],
  points: [
    { models: 5, points: 80 },
    { models: 10, points: 160 },
  ],
}

describe('diceExprSchema', () => {
  test('accepts what the engine accepts', () => {
    expect(diceExprSchema.parse(3)).toBe(3)
    expect(diceExprSchema.parse('D6')).toBe('D6')
    expect(diceExprSchema.parse('2d3+1')).toBe('2d3+1')
  })

  test('rejects what the engine rejects', () => {
    expect(() => diceExprSchema.parse('banana')).toThrow()
    expect(() => diceExprSchema.parse('D0')).toThrow()
    expect(() => diceExprSchema.parse(-1)).toThrow()
    expect(() => diceExprSchema.parse(2.5)).toThrow()
    expect(() => diceExprSchema.parse('9999D6')).toThrow()
  })
})

describe('weaponProfileSchema', () => {
  test('parses a plain profile and defaults the abilities', () => {
    const parsed = weaponProfileSchema.parse(bolter)
    expect(parsed.abilities).toEqual({ other: [] })
  })

  test('parses torrent skill and keyword abilities', () => {
    const flamer = weaponProfileSchema.parse({
      ...bolter,
      name: 'Flamer',
      attacks: 'D6',
      skill: 'torrent',
      abilities: { anti: { keyword: 'INFANTRY', threshold: 4 }, other: [] },
    })
    expect(flamer.skill).toBe('torrent')
    expect(flamer.abilities.anti?.threshold).toBe(4)
  })

  test('strength may be a number or a dice expression', () => {
    expect(weaponProfileSchema.parse({ ...bolter, strength: 8 }).strength).toBe(
      8
    )
    expect(
      weaponProfileSchema.parse({ ...bolter, strength: '2D6' }).strength
    ).toBe('2D6')
    expect(() =>
      weaponProfileSchema.parse({ ...bolter, strength: 'banana' })
    ).toThrow()
  })

  test('rejects out-of-band characteristics', () => {
    expect(() => weaponProfileSchema.parse({ ...bolter, skill: 7 })).toThrow()
    expect(() => weaponProfileSchema.parse({ ...bolter, skill: 1 })).toThrow()
    expect(() => weaponProfileSchema.parse({ ...bolter, ap: -1 })).toThrow()
    expect(() =>
      weaponProfileSchema.parse({
        ...bolter,
        abilities: { anti: { keyword: '', threshold: 4 }, other: [] },
      })
    ).toThrow()
  })
})

describe('datasheetSchema', () => {
  test('parses a complete datasheet', () => {
    const parsed = datasheetSchema.parse(intercessors)
    expect(parsed.weapons).toHaveLength(1)
    expect(parsed.points[0]).toEqual({ models: 5, points: 80 })
  })

  test('requires at least one points bracket', () => {
    expect(() =>
      datasheetSchema.parse({ ...intercessors, points: [] })
    ).toThrow()
  })

  test('rejects degenerate statlines', () => {
    expect(() =>
      datasheetSchema.parse({
        ...intercessors,
        stats: { toughness: 4, save: 1, wounds: 2 },
      })
    ).toThrow()
    expect(() =>
      datasheetSchema.parse({
        ...intercessors,
        stats: { toughness: 0, save: 3, wounds: 2 },
      })
    ).toThrow()
    expect(() =>
      datasheetSchema.parse({
        ...intercessors,
        stats: { toughness: 4, save: 3, wounds: 2, feelNoPain: 1 },
      })
    ).toThrow()
  })
})
