import { describe, expect, test } from 'bun:test'

/** Consume the BUILT package through its public name — hollow-bundle guard. */
describe('built dist smoke test', () => {
  test('the data dist resolves and opens a database', async () => {
    const data = await import('@auspex/data')
    const db = data.openDataDb(':memory:')
    expect(data.listFactions(db)).toEqual([])
    db.close()
  })
})
