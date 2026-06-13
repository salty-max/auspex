import { describe, expect, test } from 'bun:test'

/** Consume the BUILT package through its public name — hollow-bundle guard. */
describe('built dist smoke test', () => {
  test('the resolver dist resolves a list', async () => {
    const { resolve } = await import('@auspex/resolver')
    const { parseList } = await import('@auspex/dsl')
    const { list } = parseList('list "X"\nfaction Orks\nBoyz * warlord')
    const army = resolve(list!, () => undefined)
    expect(army.diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error' })
    )
  })
})
