import { describe, expect, test } from 'bun:test'

import { simulate } from '../src/sequence'
import type { Target, Weapon } from '../src/types'

/** A Space Marine Equivalent profile: T4, 3+ save, 2 wounds. */
const marine: Target = { toughness: 4, save: 3, wounds: 2, models: 5 }

const bolter: Weapon = { attacks: 10, skill: 3, strength: 4, ap: 0, damage: 1 }

function totalMass(dist: readonly number[]): number {
  return dist.reduce((sum, p) => sum + p, 0)
}

describe('simulate', () => {
  test('10 bolter shots into a Marine: mean 10/9 unsaved damage', () => {
    // 10 attacks × P(hit 3+) 2/3 × P(wound S4 vs T4) 1/2 × P(fail 3+ save) 1/3
    const result = simulate(bolter, marine)
    expect(result.mean).toBeCloseTo(10 / 9)
    expect(result.probAtLeast(1)).toBeCloseTo(1 - (8 / 9) ** 10)
  })

  test('the damage distribution is a proper probability distribution', () => {
    const result = simulate(bolter, marine)
    expect(totalMass(result.damageDistribution)).toBeCloseTo(1)
    for (const p of result.damageDistribution) {
      expect(p).toBeGreaterThanOrEqual(0)
    }
  })

  test('the result is exact and deterministic', () => {
    const a = simulate(bolter, marine)
    const b = simulate(bolter, marine)
    expect(a.damageDistribution).toEqual(b.damageDistribution)
  })

  test('torrent weapons skip the hit roll', () => {
    const flamer: Weapon = { attacks: 1, skill: 'torrent', strength: 4, ap: 0, damage: 1 }
    // 1 × P(wound) 1/2 × P(fail save) 1/3
    expect(simulate(flamer, marine).mean).toBeCloseTo(1 / 6)
  })

  test('a variable attack count contributes its mean', () => {
    // Torrent, S8 vs T4 wounds on 2+ (5/6); a 6+ save at AP -2 always fails.
    const weapon: Weapon = { attacks: 'D6', skill: 'torrent', strength: 8, ap: 2, damage: 1 }
    const target: Target = { toughness: 4, save: 6, wounds: 1, models: 10 }
    expect(simulate(weapon, target).mean).toBeCloseTo(3.5 * (5 / 6))
  })

  test('variable damage convolves per unsaved wound', () => {
    const weapon: Weapon = { attacks: 1, skill: 'torrent', strength: 8, ap: 2, damage: 'D3' }
    const target: Target = { toughness: 4, save: 6, wounds: 3, models: 1 }
    const result = simulate(weapon, target)
    // P(unsaved) = 5/6, then a flat D3 of damage.
    expect(result.mean).toBeCloseTo((5 / 6) * 2)
    expect(result.damageDistribution[0]).toBeCloseTo(1 / 6)
    expect(result.damageDistribution[2]).toBeCloseTo((5 / 6) * (1 / 3))
  })

  test('Feel No Pain scales each damage point independently', () => {
    const weapon: Weapon = { attacks: 1, skill: 'torrent', strength: 8, ap: 2, damage: 'D3' }
    const target: Target = { toughness: 4, save: 6, feelNoPain: 5, wounds: 3, models: 1 }
    // A 5+ FNP ignores each point with probability 1/3, so the mean scales by 2/3.
    expect(simulate(weapon, target).mean).toBeCloseTo((5 / 6) * 2 * (2 / 3))
  })

  test('hit modifiers flow into the hit roll', () => {
    const result = simulate(bolter, marine, { hit: -1 })
    // P(hit) drops from 2/3 to 1/2.
    expect(result.mean).toBeCloseTo(10 * (1 / 2) * (1 / 2) * (1 / 3))
  })

  test('wound modifiers flow into the wound roll', () => {
    const result = simulate(bolter, marine, { wound: 1 })
    // S4 vs T4 at +1 wounds on faces 3..5 plus the 6: 4/6.
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (4 / 6) * (1 / 3))
  })

  test('cover improves the save through the modifiers', () => {
    const guardsman: Target = { toughness: 3, save: 5, wounds: 1, models: 10 }
    const open = simulate(bolter, guardsman)
    const covered = simulate(bolter, guardsman, { cover: true })
    // The failed-save probability drops from 4/6 to 3/6.
    expect(open.mean).toBeCloseTo(10 * (2 / 3) * (4 / 6) * (4 / 6))
    expect(covered.mean).toBeCloseTo(10 * (2 / 3) * (4 / 6) * (3 / 6))
  })

  test('percentile reads quantiles off the damage distribution', () => {
    const result = simulate(bolter, marine)
    expect(result.percentile(0)).toBe(0)
    expect(result.percentile(1)).toBe(10)
    const median = result.percentile(0.5)
    expect(result.probAtLeast(median)).toBeGreaterThanOrEqual(0.5)
  })

  test('zero damage is certain when there are zero attacks', () => {
    const weapon: Weapon = { attacks: 0, skill: 3, strength: 4, ap: 0, damage: 1 }
    const result = simulate(weapon, marine)
    expect(result.damageDistribution).toEqual([1])
    expect(result.mean).toBe(0)
  })
})
