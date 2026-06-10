import { describe, expect, test } from 'bun:test'

import { diceDistribution } from '../src/dice'
import { mean } from '../src/distribution'

describe('diceDistribution', () => {
  test('a fixed number is a point mass', () => {
    expect(diceDistribution(3)).toEqual([0, 0, 0, 1])
    expect(diceDistribution('5')).toEqual([0, 0, 0, 0, 0, 1])
  })

  test('"D6" is a single uniform die', () => {
    const d = diceDistribution('D6')
    expect(d).toHaveLength(7)
    expect(mean(d)).toBeCloseTo(3.5)
  })

  test('"2D3" has support 2..6 and mean 4', () => {
    const d = diceDistribution('2D3')
    expect(mean(d)).toBeCloseTo(4)
    expect(d[2]).toBeCloseTo(1 / 9)
    expect(d[4]).toBeCloseTo(3 / 9)
    expect(d[6]).toBeCloseTo(1 / 9)
  })

  test('"D6+2" shifts the support upward', () => {
    const d = diceDistribution('D6+2')
    expect(mean(d)).toBeCloseTo(5.5)
    expect(d[3]).toBeCloseTo(1 / 6)
    expect(d[8]).toBeCloseTo(1 / 6)
    expect(d[2]).toBe(0)
  })

  test('lowercase "d" is accepted', () => {
    expect(mean(diceDistribution('2d6'))).toBeCloseTo(7)
  })

  test('rejects malformed expressions', () => {
    expect(() => diceDistribution('D')).toThrow()
    expect(() => diceDistribution('banana')).toThrow()
    expect(() => diceDistribution('6D')).toThrow()
  })
})
