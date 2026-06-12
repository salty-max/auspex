import { describe, expect, test } from 'bun:test'

/** Consume the BUILT package through its public name — hollow-bundle guard. */
describe('built dist smoke test', () => {
  test('the importer dist resolves and imports', async () => {
    const importer = await import('@auspex/importer')
    expect(
      importer.parseWeaponKeywords('Lethal Hits').abilities.lethalHits
    ).toBe(true)
    expect(() => importer.importCatalogue('<nope/>')).toThrow()
  })
})
