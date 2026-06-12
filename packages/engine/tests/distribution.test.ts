import { describe, expect, test } from 'bun:test'

import {
  binomial,
  convolve,
  die,
  mean,
  normalize,
  percentile,
  point,
  probAtLeast,
  shift,
  variance,
} from '../src/distribution'

describe('point', () => {
  test('puts all mass on a single value', () => {
    expect(point(3)).toEqual([0, 0, 0, 1])
    expect(point(0)).toEqual([1])
  })

  test('rejects negative and fractional values', () => {
    expect(() => point(-1)).toThrow()
    expect(() => point(2.5)).toThrow()
  })
})

describe('die', () => {
  test('rejects degenerate side counts', () => {
    expect(() => die(0)).toThrow()
    expect(() => die(-6)).toThrow()
    expect(() => die(3.5)).toThrow()
  })

  test('is uniform over its faces with a zero at index 0', () => {
    const d6 = die(6)
    expect(d6).toHaveLength(7)
    expect(d6[0]).toBe(0)
    for (let face = 1; face <= 6; face++) {
      expect(d6[face]).toBeCloseTo(1 / 6, 10)
    }
    expect(mean(d6)).toBeCloseTo(3.5, 10)
  })
})

describe('convolve', () => {
  test('adds two point masses', () => {
    expect(convolve(point(1), point(2))).toEqual([0, 0, 0, 1])
  })

  test('2d6 peaks at 7 with the expected mean', () => {
    const twoD6 = convolve(die(6), die(6))
    expect(mean(twoD6)).toBeCloseTo(7, 10)
    expect(twoD6[7]).toBeCloseTo(6 / 36, 10)
    expect(twoD6[2]).toBeCloseTo(1 / 36, 10)
    expect(twoD6[12]).toBeCloseTo(1 / 36, 10)
  })
})

describe('shift', () => {
  test('offsets the support', () => {
    expect(shift(point(2), 3)).toEqual([0, 0, 0, 0, 0, 1])
  })

  test('clamps negative results into index 0', () => {
    // D3 - 2: values {1,2,3} - 2 -> {-1 -> 0, 0, 1}
    const d3 = die(3)
    const shifted = shift(d3, -2)
    expect(shifted[0]).toBeCloseTo(2 / 3, 10) // -1 and 0 both clamp toward 0
    expect(shifted[1]).toBeCloseTo(1 / 3, 10)
  })
})

describe('binomial', () => {
  test('matches the textbook B(2, 0.5)', () => {
    const b = binomial(2, 0.5)
    expect(b[0]).toBeCloseTo(0.25, 10)
    expect(b[1]).toBeCloseTo(0.5, 10)
    expect(b[2]).toBeCloseTo(0.25, 10)
  })

  test('mean equals n * p', () => {
    expect(mean(binomial(10, 1 / 3))).toBeCloseTo(10 / 3, 10)
  })

  test('degenerate probabilities collapse to point masses', () => {
    expect(binomial(4, 1)).toEqual(point(4))
    expect(binomial(4, 0)).toEqual(point(0))
    expect(binomial(0, 0.5)).toEqual(point(0))
  })
})

describe('summaries', () => {
  test('variance of a d6 is 35/12', () => {
    expect(variance(die(6))).toBeCloseTo(35 / 12, 10)
  })

  test('probAtLeast sums the upper tail', () => {
    expect(probAtLeast(die(6), 5)).toBeCloseTo(2 / 6, 10)
    expect(probAtLeast(die(6), 1)).toBeCloseTo(1, 10)
  })

  test('probAtLeast rounds fractional thresholds up', () => {
    expect(probAtLeast(die(6), 4.5)).toBeCloseTo(probAtLeast(die(6), 5), 10)
    expect(probAtLeast(die(6), -2)).toBeCloseTo(1, 10)
  })

  test('percentile returns the p-quantile', () => {
    expect(percentile(die(6), 0.5)).toBe(3)
    expect(percentile(die(6), 0.01)).toBe(1)
    expect(percentile(die(6), 1)).toBe(6)
  })
})

describe('normalize', () => {
  test('rescales entries to sum to 1', () => {
    const n = normalize([1, 1, 2])
    expect(n[0]).toBeCloseTo(0.25, 10)
    expect(n[2]).toBeCloseTo(0.5, 10)
    expect(n.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 10)
  })
})
