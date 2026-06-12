import { describe, expect, test } from 'bun:test'

import {
  parseAp,
  parseDice,
  parseInches,
  parseRoll,
  parseWeaponKeywords,
} from '../src/values'

describe('characteristic parsers', () => {
  test('rolls: "3+" parses, bare numbers and N/A do not', () => {
    expect(parseRoll('3+')).toBe(3)
    expect(parseRoll('2+ ')).toBe(2)
    expect(parseRoll('3')).toBeUndefined()
    expect(parseRoll('N/A')).toBeUndefined()
  })

  test('inches: 30" parses, Melee does not', () => {
    expect(parseInches('30"')).toBe(30)
    expect(parseInches('Melee')).toBeUndefined()
  })

  test('AP: BSData prints negatives, the schema stores magnitudes', () => {
    expect(parseAp('-2')).toBe(2)
    expect(parseAp('0')).toBe(0)
    expect(parseAp('1')).toBeUndefined()
    expect(parseAp('-')).toBeUndefined()
  })

  test('dice expressions pass through, garbage does not', () => {
    expect(parseDice('2')).toBe(2)
    expect(parseDice('D6+1')).toBe('D6+1')
    expect(parseDice('2D6')).toBe('2D6')
    expect(parseDice('*')).toBeUndefined()
  })
})

describe('parseWeaponKeywords', () => {
  test('maps every engine keyword, case-insensitively', () => {
    const { abilities, torrent } = parseWeaponKeywords(
      'Torrent, Lethal Hits, devastating wounds, Blast, Sustained Hits 2, Rapid Fire 3, Melta 2, Anti-FLY 4+'
    )
    expect(torrent).toBe(true)
    expect(abilities).toEqual({
      lethalHits: true,
      devastatingWounds: true,
      blast: true,
      sustainedHits: 2,
      rapidFire: 3,
      melta: 2,
      anti: { keyword: 'FLY', threshold: 4 },
      other: [],
    })
  })

  test('preserves what the engine does not understand', () => {
    const { abilities } = parseWeaponKeywords(
      'Assault, Sustained Hits D3, Twin-linked, Hazardous'
    )
    expect(abilities.sustainedHits).toBeUndefined()
    expect(abilities.other).toEqual([
      'Assault',
      'Sustained Hits D3',
      'Twin-linked',
      'Hazardous',
    ])
  })

  test('the empty marker "-" yields nothing', () => {
    const { abilities, torrent } = parseWeaponKeywords('-')
    expect(torrent).toBe(false)
    expect(abilities).toEqual({ other: [] })
  })
})
