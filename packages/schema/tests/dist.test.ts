import { describe, expect, test } from 'bun:test'

/**
 * Consume the BUILT packages through their public names, not the sources. Both
 * bundles have shipped hollow before (an export stub with no implementations)
 * while every gate stayed green — exit code 0 is not a working build.
 */
describe('built dist smoke test', () => {
  test('the engine dist resolves and computes', async () => {
    const engine = await import('@auspex/engine')
    const result = engine.simulate(
      { attacks: 10, skill: 3, strength: 4, ap: 0, damage: 1 },
      { toughness: 4, save: 3, wounds: 2, models: 5 }
    )
    expect(result.mean).toBeCloseTo(10 / 9, 10)
  })

  test('the schema dist resolves and validates', async () => {
    const schema = await import('@auspex/schema')
    expect(() => schema.diceExprSchema.parse('banana')).toThrow()
    expect(schema.diceExprSchema.parse('2D6')).toBe('2D6')
  })
})
