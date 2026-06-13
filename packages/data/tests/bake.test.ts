import { simulate } from '@auspex/engine'
import { toEngineTarget, toEngineWeapon } from '@auspex/schema'
import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'

import { bakeAll, bakeCatalogue, stampProvenance } from '../src/bake'
import {
  getDatasheet,
  listDatasheets,
  listFactions,
  openDataDb,
  readProvenance,
} from '../src/db'

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()
const thinFaction = await Bun.file(
  new URL('fixtures/thin-faction.cat', import.meta.url).pathname
).text()
const library = await Bun.file(
  new URL('fixtures/library.cat', import.meta.url).pathname
).text()

function bakeInMemory(): Database {
  const db = openDataDb(':memory:')
  bakeCatalogue(db, {
    xml,
    overrides: [
      {
        datasheet: 'test-squad',
        reason: 'fixture: re-add the broken gun with its printed skill',
        addWeapons: [
          {
            name: 'Broken gun',
            kind: 'ranged',
            range: 12,
            attacks: 1,
            skill: 3,
            strength: 4,
            ap: 0,
            damage: 1,
            abilities: { other: [] },
          },
        ],
      },
    ],
  })
  return db
}

describe('bakeCatalogue', () => {
  test('writes datasheets, weapons and issues into the artifact', () => {
    const db = bakeInMemory()
    expect(listFactions(db)).toEqual(['Test Chapter'])
    expect(listDatasheets(db, 'Test Chapter')).toEqual([
      { id: 'test-squad', name: 'Test Squad' },
    ])
    const weaponRows = db
      .prepare('SELECT name FROM weapons ORDER BY name')
      .all() as { name: string }[]
    expect(weaponRows.map((row) => row.name)).toEqual([
      'Broken gun',
      'Chain blade',
      'Test Bolt Rifle',
    ])
    const issueCount = db.prepare('SELECT COUNT(*) AS n FROM issues').get() as {
      n: number
    }
    expect(issueCount.n).toBeGreaterThan(0)
  })

  test('an override fixes what the importer had to drop', () => {
    const db = bakeInMemory()
    const sheet = getDatasheet(db, 'Test Chapter', 'test-squad')
    const fixed = sheet?.weapons.find((weapon) => weapon.name === 'Broken gun')
    expect(fixed?.skill).toBe(3)
  })

  test('an unmatched override fails the bake loudly', () => {
    const db = openDataDb(':memory:')
    expect(() =>
      bakeCatalogue(db, {
        xml,
        overrides: [
          { datasheet: 'no-such-unit', reason: 'stale patch', set: {} },
        ],
      })
    ).toThrow('no-such-unit')
  })

  test('an override producing an invalid datasheet throws', () => {
    const db = openDataDb(':memory:')
    expect(() =>
      bakeCatalogue(db, {
        xml,
        overrides: [
          {
            datasheet: 'test-squad',
            reason: 'bad patch',
            set: { stats: { toughness: 0 } },
          },
        ],
      })
    ).toThrow('invalid datasheet')
  })

  test('provenance is recorded and queryable', () => {
    const db = bakeInMemory()
    stampProvenance(db, {
      source: 'https://github.com/BSData/wh40k-10e',
      ref: 'abc123',
      bakedAt: '2026-06-13T00:00:00.000Z',
      importerVersion: '0.0.0',
    })
    expect(readProvenance(db).ref).toBe('abc123')
  })

  test('round trip: a datasheet read back from sqlite feeds the engine', () => {
    const db = bakeInMemory()
    const sheet = getDatasheet(db, 'Test Chapter', 'test-squad')
    if (!sheet) throw new Error('missing datasheet')
    const gun = sheet.weapons.find((weapon) => weapon.name === 'Broken gun')
    if (!gun) throw new Error('missing weapon')
    const result = simulate(toEngineWeapon(gun), toEngineTarget(sheet, 5))
    // 1 attack, BS3+ (2/3) × wound S4 vs T4 (1/2) × failed 3+/5++ save with
    // AP 0 (1/3): the canonical bolter shot, straight out of the database.
    expect(result.mean).toBeCloseTo((2 / 3) * (1 / 2) * (1 / 3), 10)
  })
})

describe('bakeAll — dependency resolution', () => {
  test('a thin faction is baked with its library; the library is not a faction', () => {
    const db = openDataDb(':memory:')
    // Order should not matter: the library comes before the faction here.
    const reports = bakeAll(db, [{ xml: library }, { xml: thinFaction }])

    expect(reports.map((r) => r.faction)).toEqual(['Test Legion'])
    expect(listFactions(db)).toEqual(['Test Legion'])

    const names = listDatasheets(db, 'Test Legion').map((d) => d.name)
    expect(names).toEqual(['Library Squad', 'Native Squad'])
    const linked = getDatasheet(db, 'Test Legion', 'library-squad')
    expect(linked?.weapons[0]?.name).toBe('Library Bolter')
  })

  test('a self-contained faction needs no library', () => {
    const db = openDataDb(':memory:')
    const reports = bakeAll(db, [{ xml }])
    expect(reports[0].faction).toBe('Test Chapter')
    expect(reports[0].datasheets).toBe(1)
  })
})
