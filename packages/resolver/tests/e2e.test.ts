import { bakeCatalogue, datasheetSource, openDataDb } from '@auspex/data'
import { parseList } from '@auspex/dsl'
import { describe, expect, test } from 'bun:test'

import { resolve } from '../src/resolve'

/**
 * The full chain in one test: a BSData catalogue is baked into a real artifact,
 * a DSL list is parsed, and the two are resolved together — importer → data →
 * source → dsl → resolver, no mocks.
 */
const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

function bakedSource() {
  const db = openDataDb(':memory:')
  bakeCatalogue(db, { xml })
  return datasheetSource(db)
}

describe('resolve — against a baked artifact', () => {
  test('a parsed list binds to baked datasheets and costs out', () => {
    const { list } = parseList(
      'list "Test List"\nfaction Test Chapter\n5x Test Squad * warlord'
    )
    const army = resolve(list!, bakedSource())

    expect(army.units).toHaveLength(1)
    expect(army.units[0].datasheet.name).toBe('Test Squad')
    expect(army.units[0].points).toBe(80)
    expect(army.totalPoints).toBe(80)
    expect(army.diagnostics).toEqual([])
  })

  test('an unknown unit in a real faction is reported', () => {
    const { list } = parseList(
      'list "Test List"\nfaction Test Chapter\nImaginary Unit * warlord'
    )
    const army = resolve(list!, bakedSource())
    expect(army.units).toHaveLength(0)
    expect(army.diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error', line: 3 })
    )
  })
})
