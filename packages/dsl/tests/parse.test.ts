import { describe, expect, test } from 'bun:test'

import { parseList } from '../src/parse'

const EXAMPLE = `list "Strike Force Auspex"
faction Space Marines
detachment Gladius Task Force
points 2000

# Characters
Captain in Gravis Armour @95 * warlord, Artificer Armour
10x Intercessor Squad @160 * 2x Plasma pistol
5x Terminator Squad @185
Ballistus Dreadnought @140`

describe('parseList — headers', () => {
  test('parses the full documented example with no errors', () => {
    const { list, errors } = parseList(EXAMPLE)
    expect(errors).toEqual([])
    expect(list?.name).toBe('Strike Force Auspex')
    expect(list?.faction).toBe('Space Marines')
    expect(list?.detachment).toBe('Gladius Task Force')
    expect(list?.pointsLimit).toBe(2000)
    expect(list?.units).toHaveLength(4)
  })

  test('detachment and points are optional', () => {
    const { list, errors } = parseList('list "Bare"\nfaction Orks')
    expect(errors).toEqual([])
    expect(list?.detachment).toBeUndefined()
    expect(list?.pointsLimit).toBeUndefined()
  })

  test('a quoted list name may contain a # (not a comment)', () => {
    const { list } = parseList('list "List #1"\nfaction Tau')
    expect(list?.name).toBe('List #1')
  })
})

describe('parseList — units', () => {
  test('a unit defaults to one model, no points, no options', () => {
    const { list } = parseList('list "X"\nfaction Y\nBallistus Dreadnought')
    expect(list?.units[0]).toEqual({
      name: 'Ballistus Dreadnought',
      models: 1,
      warlord: false,
      options: [],
      position: { line: 3, column: 1 },
    })
  })

  test('count prefix, points, and per-option counts are captured', () => {
    const { list } = parseList(
      'list "X"\nfaction Y\n10x Intercessor Squad @160 * 2x Plasma pistol, Power fist'
    )
    expect(list?.units[0]).toMatchObject({
      name: 'Intercessor Squad',
      models: 10,
      points: 160,
      options: [
        { name: 'Plasma pistol', count: 2 },
        { name: 'Power fist', count: 1 },
      ],
    })
  })

  test('warlord is extracted from the options (case-insensitive)', () => {
    const { list } = parseList(
      'list "X"\nfaction Y\nCaptain @95 * WARLORD, Artificer Armour'
    )
    expect(list?.units[0].warlord).toBe(true)
    expect(list?.units[0].options).toEqual([
      { name: 'Artificer Armour', count: 1 },
    ])
  })

  test('a name starting with a digit is not mistaken for a count', () => {
    const { list } = parseList('list "X"\nfaction Y\n10th Company Task Force')
    expect(list?.units[0]).toMatchObject({
      name: '10th Company Task Force',
      models: 1,
    })
  })
})

describe('parseList — comments and whitespace', () => {
  test('full-line and inline comments are stripped', () => {
    const { list, errors } = parseList(
      'list "X"\nfaction Y\n# a comment\nIntercessors @160 # trailing note'
    )
    expect(errors).toEqual([])
    expect(list?.units).toHaveLength(1)
    expect(list?.units[0].points).toBe(160)
  })

  test('internal whitespace is collapsed on free-text fields', () => {
    const { list } = parseList(
      'list "X"\nfaction   Space   Marines\nUnit   Squad * a   b'
    )
    expect(list?.faction).toBe('Space Marines')
    expect(list?.units[0].name).toBe('Unit Squad')
    expect(list?.units[0].options[0].name).toBe('a b')
  })

  test('a quoted list name keeps its internal spacing', () => {
    const { list } = parseList('list "Strike   Force"\nfaction Y')
    expect(list?.name).toBe('Strike   Force')
  })

  test('CRLF line endings are handled', () => {
    const { list, errors } = parseList('list "X"\r\nfaction Y\r\nUnit @10')
    expect(errors).toEqual([])
    expect(list?.units[0].position.line).toBe(3)
  })
})

describe('parseList — diagnostics', () => {
  test('missing required headers are reported', () => {
    const { list, errors } = parseList('Captain @95')
    expect(list).toBeUndefined()
    expect(errors).toEqual([
      { message: 'missing "list" header', line: 1, column: 1 },
      { message: 'missing "faction" header', line: 1, column: 1 },
    ])
  })

  test('a duplicate header is reported at its line and column', () => {
    const { errors } = parseList('list "X"\nfaction A\nfaction B')
    expect(errors).toEqual([
      { message: 'duplicate "faction" header', line: 3, column: 1 },
    ])
  })

  test('a malformed header value reports once, not also as missing', () => {
    const unquoted = parseList('list X\nfaction A')
    expect(unquoted.errors).toEqual([
      { message: '"list" expects a quoted name', line: 1, column: 6 },
    ])
    const badPoints = parseList('list "X"\nfaction A\npoints lots')
    expect(badPoints.errors).toEqual([
      { message: '"points" expects an integer', line: 3, column: 8 },
    ])
    const emptyFaction = parseList('list "X"\nfaction   ')
    expect(emptyFaction.errors).toEqual([
      { message: '"faction" needs a value', line: 2, column: 1 },
    ])
  })

  test('one malformed line does not hide the rest of the list', () => {
    const { list, errors } = parseList(
      'list "X"\nfaction Y\n@95 no name\n5x Intercessor Squad @160'
    )
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ line: 3, column: 1 })
    expect(list?.units).toHaveLength(1)
    expect(list?.units[0].name).toBe('Intercessor Squad')
  })

  test('trailing junk after a unit is a parse error', () => {
    const { errors } = parseList('list "X"\nfaction Y\nUnit @160 @170')
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(3)
  })
})
