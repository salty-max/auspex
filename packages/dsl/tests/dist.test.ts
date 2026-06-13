import { describe, expect, test } from 'bun:test'

/** Consume the BUILT package through its public name — hollow-bundle guard. */
describe('built dist smoke test', () => {
  test('the dsl dist resolves and parses', async () => {
    const dsl = await import('@auspex/dsl')
    const { list, errors } = dsl.parseList('list "X"\nfaction Orks\nBoyz @100')
    expect(errors).toEqual([])
    expect(list?.units[0].name).toBe('Boyz')
  })
})
