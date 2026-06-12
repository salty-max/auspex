import { describe, expect, test } from 'bun:test'

import {
  atLeastOnD6,
  critProbability,
  hitProbability,
  rollProbability,
  saveFailProbability,
  woundProbability,
  woundThreshold,
} from '../src/rules'

describe('rollProbability', () => {
  test('plain thresholds without modifiers', () => {
    expect(rollProbability(2)).toBeCloseTo(5 / 6, 10)
    expect(rollProbability(3)).toBeCloseTo(4 / 6, 10)
    expect(rollProbability(4)).toBeCloseTo(3 / 6, 10)
    expect(rollProbability(6)).toBeCloseTo(1 / 6, 10)
  })

  test('an unmodified 1 always fails: +1 on a 2+ stays at 5/6', () => {
    expect(rollProbability(2, 1)).toBeCloseTo(5 / 6, 10)
  })

  test('an unmodified 6 always succeeds: -1 on a 6+ stays at 1/6', () => {
    expect(rollProbability(6, -1)).toBeCloseTo(1 / 6, 10)
  })

  test('modifiers shift the middle faces', () => {
    expect(rollProbability(4, 1)).toBeCloseTo(4 / 6, 10)
    expect(rollProbability(4, -1)).toBeCloseTo(2 / 6, 10)
    expect(rollProbability(3, -1)).toBeCloseTo(3 / 6, 10)
  })

  test('the net modifier is clamped to ±1', () => {
    expect(rollProbability(4, 3)).toBeCloseTo(rollProbability(4, 1), 10)
    expect(rollProbability(4, -3)).toBeCloseTo(rollProbability(4, -1), 10)
  })

  test('re-rolling 1s: 3+ becomes 2/3 + (1/6)(2/3) = 7/9', () => {
    expect(rollProbability(3, 0, 'ones')).toBeCloseTo(7 / 9, 10)
    expect(rollProbability(2, 0, 'ones')).toBeCloseTo((5 / 6) * (7 / 6), 10)
  })

  test('full re-roll: failures get a second chance, 3+ becomes 8/9', () => {
    expect(rollProbability(3, 0, 'full')).toBeCloseTo(8 / 9, 10)
    expect(rollProbability(6, 0, 'full')).toBeCloseTo(
      1 / 6 + (5 / 6) * (1 / 6),
      10
    )
  })

  test('the re-rolled die takes the same modifier', () => {
    // 4+ at -1 is 2/6 on one die; a full re-roll compounds the same probability.
    expect(rollProbability(4, -1, 'full')).toBeCloseTo(
      2 / 6 + (4 / 6) * (2 / 6),
      10
    )
  })
})

describe('critProbability', () => {
  test('an unmodified 6 lands with 1/6 regardless of threshold and modifier', () => {
    expect(critProbability(3)).toBeCloseTo(1 / 6, 10)
    expect(critProbability(5, -1)).toBeCloseTo(1 / 6, 10)
  })

  test('re-rolling 1s adds a 1/36 second chance at a 6', () => {
    expect(critProbability(3, 0, 'ones')).toBeCloseTo(7 / 36, 10)
  })

  test('a full re-roll lets every would-be failure retry the 6', () => {
    // BS3+: failures are 1/3 of dice, each re-roll shows a 6 with 1/6.
    expect(critProbability(3, 0, 'full')).toBeCloseTo(
      1 / 6 + (1 / 3) * (1 / 6),
      10
    )
    // A -1 modifier widens the failure mass, so the crit chance rises too.
    expect(critProbability(3, -1, 'full')).toBeCloseTo(
      1 / 6 + (1 / 2) * (1 / 6),
      10
    )
  })

  test('successes are never re-rolled, so the crit chance stays below 2/6', () => {
    expect(critProbability(6, 0, 'full')).toBeCloseTo(
      1 / 6 + (5 / 6) * (1 / 6),
      10
    )
    expect(critProbability(6, 0, 'full')).toBeLessThan(2 / 6)
  })
})

describe('critOn (Anti weapons)', () => {
  test('critical faces always succeed, past an unfavourable threshold', () => {
    // Wound on 6+ but crits on 4+: faces 4, 5, 6 all succeed.
    expect(rollProbability(6, 0, undefined, 4)).toBeCloseTo(3 / 6, 10)
    // Modifiers cannot remove criticals (the roll is unmodified).
    expect(rollProbability(6, -1, undefined, 4)).toBeCloseTo(3 / 6, 10)
  })

  test('a lower crit threshold widens critProbability', () => {
    expect(critProbability(6, 0, undefined, 4)).toBeCloseTo(3 / 6, 10)
    expect(critProbability(4, 0, undefined, 2)).toBeCloseTo(5 / 6, 10)
  })

  test('re-rolled dice can land criticals at the lower threshold', () => {
    // Crit on 4+ with re-roll 1s: 3/6 + (1/6)(3/6).
    expect(critProbability(6, 0, 'ones', 4)).toBeCloseTo(
      3 / 6 + (1 / 6) * (3 / 6),
      10
    )
    // Full re-roll, wound on 6+ crit on 4+: failures (1/2) retry the crit (1/2).
    expect(critProbability(6, 0, 'full', 4)).toBeCloseTo(
      3 / 6 + (1 / 2) * (3 / 6),
      10
    )
  })

  test('the threshold clamps to 2..6', () => {
    // 1+ behaves as 2+ (an unmodified 1 always fails)...
    expect(critProbability(4, 0, undefined, 1)).toBeCloseTo(5 / 6, 10)
    // ...and 7+ behaves as 6 (an unmodified 6 is always critical).
    expect(critProbability(4, 0, undefined, 7)).toBeCloseTo(1 / 6, 10)
  })

  test('default critOn leaves existing probabilities untouched', () => {
    expect(rollProbability(3, 0, undefined, 6)).toBeCloseTo(
      rollProbability(3),
      10
    )
    expect(critProbability(3, 0, 'full', 6)).toBeCloseTo(
      critProbability(3, 0, 'full'),
      10
    )
  })
})

describe('atLeastOnD6', () => {
  test('plain d6 tail probabilities', () => {
    expect(atLeastOnD6(4)).toBeCloseTo(1 / 2, 10)
    expect(atLeastOnD6(6)).toBeCloseTo(1 / 6, 10)
  })

  test('clamps impossible and guaranteed thresholds', () => {
    expect(atLeastOnD6(1)).toBe(1)
    expect(atLeastOnD6(0)).toBe(1)
    expect(atLeastOnD6(7)).toBe(0)
  })
})

describe('hitProbability', () => {
  test('matches rollProbability for the same skill', () => {
    expect(hitProbability(3)).toBeCloseTo(4 / 6, 10)
    expect(hitProbability(3, -1)).toBeCloseTo(3 / 6, 10)
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
    expect(woundProbability(4, 4)).toBeCloseTo(3 / 6, 10)
    expect(woundProbability(8, 4)).toBeCloseTo(5 / 6, 10)
    expect(woundProbability(4, 4, -1)).toBeCloseTo(2 / 6, 10)
  })
})

describe('saveFailProbability', () => {
  test('plain armour save', () => {
    expect(saveFailProbability({ save: 3, ap: 0 })).toBeCloseTo(2 / 6, 10)
    expect(saveFailProbability({ save: 6, ap: 0 })).toBeCloseTo(5 / 6, 10)
  })

  test('AP degrades the armour save', () => {
    expect(saveFailProbability({ save: 3, ap: 2 })).toBeCloseTo(4 / 6, 10)
  })

  test('a save pushed past 6 always fails', () => {
    expect(saveFailProbability({ save: 6, ap: 2 })).toBe(1)
  })

  test('the invulnerable save caps the damage of high AP', () => {
    expect(saveFailProbability({ save: 3, ap: 3, invuln: 4 })).toBeCloseTo(
      3 / 6,
      10
    )
  })

  test('the invulnerable save is ignored when the armour save is better', () => {
    expect(saveFailProbability({ save: 2, ap: 0, invuln: 4 })).toBeCloseTo(
      1 / 6,
      10
    )
  })

  test('cover improves the armour save by one', () => {
    expect(saveFailProbability({ save: 4, ap: 0, cover: true })).toBeCloseTo(
      2 / 6,
      10
    )
    expect(saveFailProbability({ save: 4, ap: 1, cover: true })).toBeCloseTo(
      3 / 6,
      10
    )
  })

  test('cover cannot improve a 3+ or better save against AP 0', () => {
    expect(saveFailProbability({ save: 3, ap: 0, cover: true })).toBeCloseTo(
      2 / 6,
      10
    )
    expect(saveFailProbability({ save: 2, ap: 0, cover: true })).toBeCloseTo(
      1 / 6,
      10
    )
  })

  test('cover applies to a 3+ save once the attack has AP', () => {
    expect(saveFailProbability({ save: 3, ap: 1, cover: true })).toBeCloseTo(
      2 / 6,
      10
    )
  })

  test('a natural 1 always fails: the save never gets better than 2+', () => {
    expect(saveFailProbability({ save: 1, ap: 0 })).toBeCloseTo(1 / 6, 10)
  })
})
