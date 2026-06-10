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
    const flamer: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 4,
      ap: 0,
      damage: 1,
    }
    // 1 × P(wound) 1/2 × P(fail save) 1/3
    expect(simulate(flamer, marine).mean).toBeCloseTo(1 / 6)
  })

  test('a variable attack count contributes its mean', () => {
    // Torrent, S8 vs T4 wounds on 2+ (5/6); a 6+ save at AP -2 always fails.
    const weapon: Weapon = {
      attacks: 'D6',
      skill: 'torrent',
      strength: 8,
      ap: 2,
      damage: 1,
    }
    const target: Target = { toughness: 4, save: 6, wounds: 1, models: 10 }
    expect(simulate(weapon, target).mean).toBeCloseTo(3.5 * (5 / 6))
  })

  test('variable damage convolves per unsaved wound', () => {
    const weapon: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 8,
      ap: 2,
      damage: 'D3',
    }
    const target: Target = { toughness: 4, save: 6, wounds: 3, models: 1 }
    const result = simulate(weapon, target)
    // P(unsaved) = 5/6, then a flat D3 of damage.
    expect(result.mean).toBeCloseTo((5 / 6) * 2)
    expect(result.damageDistribution[0]).toBeCloseTo(1 / 6)
    expect(result.damageDistribution[2]).toBeCloseTo((5 / 6) * (1 / 3))
  })

  test('Feel No Pain scales each damage point independently', () => {
    const weapon: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 8,
      ap: 2,
      damage: 'D3',
    }
    const target: Target = {
      toughness: 4,
      save: 6,
      feelNoPain: 5,
      wounds: 3,
      models: 1,
    }
    // A 5+ FNP ignores each point with probability 1/3, so the mean scales by 2/3.
    expect(simulate(weapon, target).mean).toBeCloseTo((5 / 6) * 2 * (2 / 3))
  })

  test('hit modifiers flow into the hit roll', () => {
    const result = simulate(bolter, marine, { hit: -1 })
    // P(hit) drops from 2/3 to 1/2.
    expect(result.mean).toBeCloseTo(10 * (1 / 2) * (1 / 2) * (1 / 3))
  })

  test('hit re-rolls flow into the hit roll', () => {
    const result = simulate(bolter, marine, { rerollHit: 'ones' })
    // P(hit) rises from 2/3 to 7/9.
    expect(result.mean).toBeCloseTo(10 * (7 / 9) * (1 / 2) * (1 / 3))
  })

  test('wound re-rolls flow into the wound roll', () => {
    const result = simulate(bolter, marine, { rerollWound: 'full' })
    // P(wound) rises from 1/2 to 1/2 + (1/2)(1/2) = 3/4.
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (3 / 4) * (1 / 3))
  })

  test('torrent weapons ignore hit re-rolls (no hit roll is made)', () => {
    const flamer: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 4,
      ap: 0,
      damage: 1,
    }
    const plain = simulate(flamer, marine)
    const rerolled = simulate(flamer, marine, { rerollHit: 'full' })
    expect(rerolled.mean).toBeCloseTo(plain.mean)
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

  test('Sustained Hits: the critical slice scores extra hits', () => {
    const weapon: Weapon = {
      ...bolter,
      keywords: { sustainedHits: 1 },
    }
    // Mean hits per attack: P(hit) + X·P(crit) = 4/6 + 1/6 = 5/6.
    const result = simulate(weapon, marine)
    expect(result.mean).toBeCloseTo(10 * (5 / 6) * (1 / 2) * (1 / 3))
  })

  test('Sustained Hits 2 adds two hits per critical', () => {
    const weapon: Weapon = {
      ...bolter,
      keywords: { sustainedHits: 2 },
    }
    // Mean hits per attack: 4/6 + 2·(1/6) = 1.
    expect(simulate(weapon, marine).mean).toBeCloseTo(
      10 * 1 * (1 / 2) * (1 / 3)
    )
  })

  test('Sustained Hits: exact per-attack distribution (issue acceptance values)', () => {
    // 1 attack, BS3+, Sustained 1: P(0 hits) = 2/6, P(1) = 3/6, P(2 hits) = 1/6.
    // Against T4 with no usable save (6+ at AP -1), each hit wounds with 1/2,
    // so the damage distribution exposes the hits distribution through q = 1/2.
    const weapon: Weapon = {
      attacks: 1,
      skill: 3,
      strength: 4,
      ap: 1,
      damage: 1,
      keywords: { sustainedHits: 1 },
    }
    const target: Target = { toughness: 4, save: 6, wounds: 1, models: 1 }
    const d = simulate(weapon, target).damageDistribution
    // P(2 damage) = P(crit)·q² = (1/6)(1/4); P(1) = (3/6)q + (1/6)·2q(1−q) = 1/3.
    expect(d[2]).toBeCloseTo((1 / 6) * (1 / 4))
    expect(d[1]).toBeCloseTo(1 / 3)
    expect(totalMass(d)).toBeCloseTo(1)
  })

  test('Sustained Hits compounds with hit re-rolls through the crit probability', () => {
    const weapon: Weapon = {
      ...bolter,
      keywords: { sustainedHits: 1 },
    }
    // Re-roll 1s: P(hit) = 7/9, P(crit) = 7/36 → mean hits = 7/9 + 7/36 = 35/36.
    const result = simulate(weapon, marine, { rerollHit: 'ones' })
    expect(result.mean).toBeCloseTo(10 * (35 / 36) * (1 / 2) * (1 / 3))
  })

  test('Sustained Hits is inert on torrent weapons (no hit roll, no crits)', () => {
    const flamer: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 4,
      ap: 0,
      damage: 1,
    }
    const sustained = simulate(
      { ...flamer, keywords: { sustainedHits: 2 } },
      marine
    )
    expect(sustained.mean).toBeCloseTo(simulate(flamer, marine).mean)
  })

  test('Lethal Hits: the critical slice skips the wound roll (issue acceptance value)', () => {
    const weapon: Weapon = { ...bolter, keywords: { lethalHits: true } }
    // Wounds per attack: 1/6 + (3/6)(1/2) = 5/12 instead of (4/6)(1/2) = 1/3.
    const result = simulate(weapon, marine)
    expect(result.mean).toBeCloseTo(10 * (5 / 12) * (1 / 3))
  })

  test('Lethal Hits shines against high toughness', () => {
    const weapon: Weapon = { ...bolter, keywords: { lethalHits: true } }
    const knight: Target = { toughness: 8, save: 6, wounds: 10, models: 1 }
    // S4 vs T8 wounds on 6+: per attack 1/6 + (3/6)(1/6) = 1/4 vs plain (4/6)(1/6) = 1/9.
    const lethal = simulate(weapon, knight)
    const plain = simulate(bolter, knight)
    expect(lethal.mean).toBeCloseTo(10 * (1 / 4) * (5 / 6))
    expect(plain.mean).toBeCloseTo(10 * (1 / 9) * (5 / 6))
  })

  test('Lethal + Sustained: only the critting hit auto-wounds, extra hits roll', () => {
    // 1 attack BS3+ S4 vs T4, no usable save (fail = 1), Sustained 1 + Lethal.
    const weapon: Weapon = {
      attacks: 1,
      skill: 3,
      strength: 4,
      ap: 1,
      damage: 1,
      keywords: { sustainedHits: 1, lethalHits: true },
    }
    const target: Target = { toughness: 4, save: 6, wounds: 1, models: 1 }
    const d = simulate(weapon, target).damageDistribution
    // Crit (1/6): 1 auto-wound + Bernoulli(1/2) for the extra hit → P(2) = (1/6)(1/2).
    expect(d[2]).toBeCloseTo(1 / 12)
    // P(1) = normal hit wounding (3/6)(1/2) + crit whose extra hit misses (1/6)(1/2).
    expect(d[1]).toBeCloseTo(1 / 4 + 1 / 12)
    expect(totalMass(d)).toBeCloseTo(1)
  })

  test('Lethal Hits compounds with hit re-rolls through the crit probability', () => {
    const weapon: Weapon = { ...bolter, keywords: { lethalHits: true } }
    // Re-roll 1s: P(hit) = 7/9, P(crit) = 7/36.
    // Wounds per attack: 7/36 + (7/9 − 7/36)(1/2) = 35/72.
    const result = simulate(weapon, marine, { rerollHit: 'ones' })
    expect(result.mean).toBeCloseTo(10 * (35 / 72) * (1 / 3))
  })

  test('Lethal Hits is inert on torrent weapons', () => {
    const flamer: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 4,
      ap: 0,
      damage: 1,
    }
    const lethal = simulate(
      { ...flamer, keywords: { lethalHits: true } },
      marine
    )
    expect(lethal.mean).toBeCloseTo(simulate(flamer, marine).mean)
  })

  test('Devastating Wounds: the critical-wound slice bypasses the save', () => {
    const weapon: Weapon = { ...bolter, keywords: { devastatingWounds: true } }
    // Unsaved per rolled wound: 1/6 + (1/2 − 1/6)(1/3) = 5/18 instead of (1/2)(1/3).
    const result = simulate(weapon, marine)
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (5 / 18))
  })

  test('Devastating Wounds bypasses invulnerable saves too', () => {
    const weapon: Weapon = {
      ...bolter,
      ap: 3,
      keywords: { devastatingWounds: true },
    }
    const stormShield: Target = {
      toughness: 4,
      save: 3,
      invuln: 4,
      wounds: 3,
      models: 1,
    }
    // The invuln (fail 1/2) catches normal wounds, never critical ones:
    // u = 1/6 + (1/2 − 1/6)(1/2) = 1/3 instead of (1/2)(1/2) = 1/4.
    const result = simulate(weapon, stormShield)
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (1 / 3))
  })

  test('Devastating Wounds applies to torrent weapons (the wound roll is made)', () => {
    const flamer: Weapon = {
      attacks: 1,
      skill: 'torrent',
      strength: 4,
      ap: 0,
      damage: 1,
      keywords: { devastatingWounds: true },
    }
    // Auto-hit, then u = 1/6 + (1/2 − 1/6)(1/3) = 5/18 instead of 1/6 plain.
    expect(simulate(flamer, marine).mean).toBeCloseTo(5 / 18)
  })

  test('Devastating + Lethal: the automatic wound still takes the save', () => {
    // 1 attack BS3+ S4 vs T4, save 3+ (fail 1/3), both keywords, damage 1.
    const weapon: Weapon = {
      attacks: 1,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
      keywords: { lethalHits: true, devastatingWounds: true },
    }
    const d = simulate(weapon, marine).damageDistribution
    // Normal hit (3/6) wounds-and-passes with u = 5/18; crit hit (1/6) auto-wounds
    // (never critical, takes the save) with 1/3.
    expect(d[1]).toBeCloseTo((3 / 6) * (5 / 18) + (1 / 6) * (1 / 3))
    expect(totalMass(d)).toBeCloseTo(1)
  })

  test('Devastating Wounds compounds with wound re-rolls through the crit probability', () => {
    const weapon: Weapon = { ...bolter, keywords: { devastatingWounds: true } }
    // Re-roll 1s on wounds: pWound = 7/12, pCritWound = 7/36.
    // u = 7/36 + (7/12 − 7/36)(1/3) = 35/108.
    const result = simulate(weapon, marine, { rerollWound: 'ones' })
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (35 / 108))
  })

  test('Devastating Wounds does not bypass Feel No Pain', () => {
    const weapon: Weapon = { ...bolter, keywords: { devastatingWounds: true } }
    const fnpMarine: Target = { ...marine, feelNoPain: 5 }
    // FNP applies after the (bypassed) save: the mean scales by 2/3.
    const result = simulate(weapon, fnpMarine)
    expect(result.mean).toBeCloseTo(10 * (2 / 3) * (5 / 18) * (2 / 3))
  })

  test('percentile reads quantiles off the damage distribution', () => {
    const result = simulate(bolter, marine)
    expect(result.percentile(0)).toBe(0)
    expect(result.percentile(1)).toBe(10)
    const median = result.percentile(0.5)
    expect(result.probAtLeast(median)).toBeGreaterThanOrEqual(0.5)
  })

  test('zero damage is certain when there are zero attacks', () => {
    const weapon: Weapon = {
      attacks: 0,
      skill: 3,
      strength: 4,
      ap: 0,
      damage: 1,
    }
    const result = simulate(weapon, marine)
    expect(result.damageDistribution).toEqual([1])
    expect(result.mean).toBe(0)
  })
})
