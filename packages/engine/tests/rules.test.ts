import { describe, expect, test } from 'bun:test'

import {
  atLeastOnD6,
  hitProbability,
  rollProbability,
  saveFailProbability,
  woundProbability,
  woundThreshold,
} from '../src/rules'

describe('rollProbability', () => {
  test('plain thresholds without modifiers', () => {
    expect(rollProbability(2)).toBeCloseTo(5 / 6)
    expect(rollProbability(3)).toBeCloseTo(4 / 6)
    expect(rollProbability(4)).toBeCloseTo(3 / 6)
    expect(rollProbability(6)).toBeCloseTo(1 / 6)
  })

  test('an unmodified 1 always fails: +1 on a 2+ stays at 5/6', () => {
    expect(rollProbability(2, 1)).toBeCloseTo(5 / 6)
  })

  test('an unmodified 6 always succeeds: -1 on a 6+ stays at 1/6', () => {
    expect(rollProbability(6, -1)).toBeCloseTo(1 / 6)
  })

  test('modifiers shift the middle faces', () => {
    expect(rollProbability(4, 1)).toBeCloseTo(4 / 6)
    expect(rollProbability(4, -1)).toBeCloseTo(2 / 6)
    expect(rollProbability(3, -1)).toBeCloseTo(3 / 6)
  })

  test('the net modifier is clamped to ±1', () => {
    expect(rollProbability(4, 3)).toBeCloseTo(rollProbability(4, 1))
    expect(rollProbability(4, -3)).toBeCloseTo(rollProbability(4, -1))
  })
})

describe('atLeastOnD6', () => {
  test('plain d6 tail probabilities', () => {
    expect(atLeastOnD6(4)).toBeCloseTo(1 / 2)
    expect(atLeastOnD6(6)).toBeCloseTo(1 / 6)
  })

  test('clamps impossible and guaranteed thresholds', () => {
    expect(atLeastOnD6(1)).toBe(1)
    expect(atLeastOnD6(0)).toBe(1)
    expect(atLeastOnD6(7)).toBe(0)
  })
})

describe('hitProbability', () => {
  test('matches rollProbability for the same skill', () => {
    expect(hitProbability(3)).toBeCloseTo(4 / 6)
    expect(hitProbability(3, -1)).toBeCloseTo(3 / 6)
  })
})

describe('woundThreshold', () => {
  test('encodes the 10e strength-versus-toughness chart', () => {
    expect(woundThreshold(8, 4)).toBe(2) // S ≥ 2×T
    expect(woundThreshold(5, 4)).toBe(3) // S > T
    expect(woundThreshold(4, 4)).toBe(4) // S = T
    expect(woundThreshold(3, 4)).toBe(5) // ½T < S < T
    expect(woundThreshold(3, 6)).toBe(6) // S ≤ ½T
    expect(woundThreshold(2, 4)).toBe(6)
  })

  test('boundary cases land on the right side of the chart', () => {
    expect(woundThreshold(8, 4)).toBe(2) // exactly double
    expect(woundThreshold(7, 4)).toBe(3) // just under double
    expect(woundThreshold(3, 5)).toBe(5) // just above half
  })
})

describe('woundProbability', () => {
  test('composes the chart with the roll', () => {
    expect(woundProbability(4, 4)).toBeCloseTo(3 / 6)
    expect(woundProbability(8, 4)).toBeCloseTo(5 / 6)
    expect(woundProbability(4, 4, -1)).toBeCloseTo(2 / 6)
  })
})

describe('saveFailProbability', () => {
  test('plain armour save', () => {
    expect(saveFailProbability({ save: 3, ap: 0 })).toBeCloseTo(2 / 6)
    expect(saveFailProbability({ save: 6, ap: 0 })).toBeCloseTo(5 / 6)
  })

  test('AP degrades the armour save', () => {
    expect(saveFailProbability({ save: 3, ap: 2 })).toBeCloseTo(4 / 6)
  })

  test('a save pushed past 6 always fails', () => {
    expect(saveFailProbability({ save: 6, ap: 2 })).toBe(1)
  })

  test('the invulnerable save caps the damage of high AP', () => {
    expect(saveFailProbability({ save: 3, ap: 3, invuln: 4 })).toBeCloseTo(
      3 / 6
    )
  })

  test('the invulnerable save is ignored when the armour save is better', () => {
    expect(saveFailProbability({ save: 2, ap: 0, invuln: 4 })).toBeCloseTo(
      1 / 6
    )
  })

  test('cover improves the armour save by one', () => {
    expect(saveFailProbability({ save: 4, ap: 0, cover: true })).toBeCloseTo(
      2 / 6
    )
    expect(saveFailProbability({ save: 4, ap: 1, cover: true })).toBeCloseTo(
      3 / 6
    )
  })

  test('cover cannot improve a 3+ or better save against AP 0', () => {
    expect(saveFailProbability({ save: 3, ap: 0, cover: true })).toBeCloseTo(
      2 / 6
    )
    expect(saveFailProbability({ save: 2, ap: 0, cover: true })).toBeCloseTo(
      1 / 6
    )
  })

  test('cover applies to a 3+ save once the attack has AP', () => {
    expect(saveFailProbability({ save: 3, ap: 1, cover: true })).toBeCloseTo(
      2 / 6
    )
  })

  test('a natural 1 always fails: the save never gets better than 2+', () => {
    expect(saveFailProbability({ save: 1, ap: 0 })).toBeCloseTo(1 / 6)
  })
})
