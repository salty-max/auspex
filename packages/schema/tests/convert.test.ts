import { simulate } from '@auspex/engine'
import { describe, expect, test } from 'bun:test'

import { toEngineTarget, toEngineWeapon } from '../src/convert'
import { datasheetSchema, weaponProfileSchema } from '../src/datasheet'

const marines = datasheetSchema.parse({
  id: 'intercessor-squad',
  name: 'Intercessor Squad',
  faction: 'Space Marines',
  keywords: ['INFANTRY'],
  stats: { toughness: 4, save: 3, wounds: 2 },
  points: [{ models: 5, points: 80 }],
})

describe('toEngineWeapon', () => {
  test('converts a plain profile losslessly', () => {
    const profile = weaponProfileSchema.parse({
      name: 'Bolt rifle',
      kind: 'ranged',
      range: 24,
      attacks: 10,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
    })
    expect(toEngineWeapon(profile)).toEqual({
      kind: 'ranged',
      attacks: 10,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
    })
  })

  test('maps every keyword ability the engine understands', () => {
    const profile = weaponProfileSchema.parse({
      name: 'Kitchen sink',
      kind: 'ranged',
      range: 12,
      attacks: 'D6',
      skill: 'torrent',
      strength: 8,
      ap: 2,
      damage: 'D3',
      abilities: {
        sustainedHits: 1,
        lethalHits: true,
        devastatingWounds: true,
        blast: true,
        rapidFire: 1,
        melta: 2,
        anti: { keyword: 'VEHICLE', threshold: 4 },
        other: ['Hazardous'],
      },
    })
    expect(toEngineWeapon(profile).keywords).toEqual({
      sustainedHits: 1,
      lethalHits: true,
      devastatingWounds: true,
      blast: true,
      rapidFire: 1,
      melta: 2,
      anti: 4,
    })
  })
})

describe('toEngineTarget', () => {
  test('converts the statline for an allowed unit size', () => {
    expect(toEngineTarget(marines, 5)).toEqual({
      toughness: 4,
      save: 3,
      wounds: 2,
      models: 5,
    })
  })

  test('rejects a unit size the datasheet does not allow', () => {
    expect(() => toEngineTarget(marines, 7)).toThrow('intercessor-squad')
  })
})

describe('round trip into the engine', () => {
  test('a converted profile feeds simulate without fixup', () => {
    const bolter = weaponProfileSchema.parse({
      name: 'Bolt rifle',
      kind: 'ranged',
      range: 24,
      attacks: 10,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
    })
    const result = simulate(toEngineWeapon(bolter), toEngineTarget(marines, 5))
    // The canonical hand value: 10 × (2/3)(1/2)(1/3) = 10/9.
    expect(result.mean).toBeCloseTo(10 / 9, 10)
  })
})
