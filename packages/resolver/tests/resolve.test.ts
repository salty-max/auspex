import { parseList } from '@auspex/dsl'
import { simulate } from '@auspex/engine'
import { type Datasheet, toEngineTarget, toEngineWeapon } from '@auspex/schema'
import { describe, expect, test } from 'bun:test'

import { type DatasheetSource, resolve } from '../src/resolve'

const intercessors: Datasheet = {
  id: 'intercessor-squad',
  name: 'Intercessor Squad',
  faction: 'Space Marines',
  keywords: ['INFANTRY'],
  stats: { toughness: 4, save: 3, wounds: 2 },
  weapons: [
    {
      name: 'Bolt rifle',
      kind: 'ranged',
      range: 24,
      attacks: 10,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
      abilities: { other: [] },
    },
  ],
  abilities: [],
  points: [
    { models: 5, points: 80 },
    { models: 10, points: 160 },
  ],
}

const captain: Datasheet = {
  id: 'captain',
  name: 'Captain in Gravis Armour',
  faction: 'Space Marines',
  keywords: ['CHARACTER'],
  stats: { toughness: 6, save: 3, wounds: 5 },
  weapons: [],
  abilities: [],
  points: [{ models: 1, points: 95 }],
}

function sourceFrom(...sheets: Datasheet[]): DatasheetSource {
  const key = (faction: string, name: string): string =>
    `${faction.toLowerCase()}|${name.toLowerCase()}`
  const map = new Map(
    sheets.map((sheet) => [key(sheet.faction, sheet.name), sheet])
  )
  return (faction, name) => map.get(key(faction, name))
}

const source = sourceFrom(intercessors, captain)

function armyFrom(body: string) {
  const { list } = parseList(`list "X"\nfaction Space Marines\n${body}`)
  if (!list) throw new Error('list failed to parse')
  return list
}

describe('resolve — binding', () => {
  test('binds units to datasheets and totals their points', () => {
    const army = resolve(
      armyFrom('Captain in Gravis Armour @95 * warlord\n10x Intercessor Squad'),
      source
    )
    expect(army.units.map((u) => u.datasheet.id)).toEqual([
      'captain',
      'intercessor-squad',
    ])
    expect(army.totalPoints).toBe(95 + 160)
    expect(army.diagnostics).toEqual([])
  })

  test('an unknown datasheet is an error at the unit line', () => {
    const army = resolve(
      armyFrom('Captain in Gravis Armour * warlord\nNob Bikerz @150'),
      source
    )
    expect(army.units).toHaveLength(1)
    expect(army.diagnostics).toContainEqual({
      severity: 'error',
      message: 'unknown datasheet "Nob Bikerz" in Space Marines',
      line: 4,
      column: 1,
    })
  })

  test('case- and spacing-insensitive names still bind', () => {
    const army = resolve(armyFrom('intercessor   squad * warlord'), source)
    expect(army.units[0]?.datasheet.id).toBe('intercessor-squad')
  })
})

describe('resolve — points', () => {
  test('uses the datasheet bracket for the declared model count', () => {
    const army = resolve(armyFrom('5x Intercessor Squad * warlord'), source)
    expect(army.units[0].points).toBe(80)
  })

  test('a declared cost that disagrees with the bracket warns', () => {
    const army = resolve(
      armyFrom('10x Intercessor Squad @150 * warlord'),
      source
    )
    expect(army.units[0].points).toBe(160)
    expect(army.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining(
          'declared @150 but 10 models cost 160'
        ),
      })
    )
  })

  test('a model count with no bracket falls back to the declared points', () => {
    const army = resolve(
      armyFrom('7x Intercessor Squad @120 * warlord'),
      source
    )
    expect(army.units[0].points).toBe(120)
    expect(army.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining('no 7-model size (have 5, 10)'),
      })
    )
  })

  test('over the points limit is an error', () => {
    const { list } = parseList(
      'list "X"\nfaction Space Marines\npoints 200\n10x Intercessor Squad @160 * warlord\nCaptain in Gravis Armour @95'
    )
    const army = resolve(list!, source)
    expect(army.totalPoints).toBe(255)
    expect(army.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        message: 'army is 255 points, over the 200 limit',
      })
    )
  })
})

describe('resolve — warlord rule', () => {
  test('no warlord warns', () => {
    const army = resolve(armyFrom('10x Intercessor Squad'), source)
    expect(army.diagnostics).toContainEqual({
      severity: 'warning',
      message: 'no warlord declared',
    })
  })

  test('more than one warlord warns', () => {
    const army = resolve(
      armyFrom(
        'Captain in Gravis Armour * warlord\n10x Intercessor Squad * warlord'
      ),
      source
    )
    expect(army.diagnostics).toContainEqual({
      severity: 'warning',
      message: '2 warlords declared (expected exactly 1)',
    })
  })
})

describe('resolve — engine round trip', () => {
  test('a resolved unit feeds simulate via the schema converters', () => {
    const army = resolve(armyFrom('10x Intercessor Squad * warlord'), source)
    const unit = army.units[0]
    const result = simulate(
      toEngineWeapon(unit.datasheet.weapons[0]),
      toEngineTarget(unit.datasheet, unit.models)
    )
    // 10 bolter shots into the squad's own T4/3+/W2 profile: the canonical 10/9.
    expect(result.mean).toBeCloseTo(10 / 9, 10)
  })
})
