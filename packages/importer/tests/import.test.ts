import { simulate } from '@auspex/engine'
import { toEngineTarget, toEngineWeapon } from '@auspex/schema'
import { describe, expect, test } from 'bun:test'

import { importCatalogue } from '../src/import'

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

const { datasheets, issues } = importCatalogue(xml)
const squad = datasheets[0]

describe('importCatalogue', () => {
  test('imports the unit with its statline, invuln, keywords and points', () => {
    expect(datasheets).toHaveLength(1)
    expect(squad.id).toBe('test-squad')
    expect(squad.faction).toBe('Test Chapter')
    expect(squad.stats).toEqual({
      movement: 6,
      toughness: 4,
      save: 3,
      invuln: 5,
      wounds: 2,
      leadership: 6,
      objectiveControl: 2,
    })
    expect(squad.keywords).toEqual(['ADEPTUS ASTARTES', 'INFANTRY'])
    // 4 marines minimum + 1 sergeant, base-size points.
    expect(squad.points).toEqual([{ models: 5, points: 80 }])
  })

  test('the invulnerable save ability is lifted, the rest stays verbatim', () => {
    expect(squad.abilities).toEqual([
      { name: 'Test Doctrine', description: 'Re-roll something once.' },
      { name: 'Linked Rule', description: 'Shared via infoLink.' },
    ])
  })

  test('weapons resolve through entry links and keywords map structurally', () => {
    const gun = squad.weapons.find((w) => w.name === 'Test Bolt Rifle')
    expect(gun).toBeDefined()
    expect(gun?.skill).toBe('torrent')
    expect(gun?.ap).toBe(2)
    expect(gun?.abilities.rapidFire).toBe(1)
    expect(gun?.abilities.anti).toEqual({ keyword: 'VEHICLE', threshold: 4 })
    // Sustained Hits D3 is not engine-representable: preserved, not dropped.
    expect(gun?.abilities.other).toContain('Sustained Hits D3')

    const blade = squad.weapons.find((w) => w.name === 'Chain blade')
    expect(blade?.kind).toBe('melee')
    expect(blade?.skill).toBe(3)
  })

  test('unmappable entries are reported, never silently dropped', () => {
    const reasons = issues.map((issue) => `${issue.entry}: ${issue.reason}`)
    expect(reasons).toContainEqual(expect.stringContaining('Broken gun'))
    expect(reasons).toContainEqual(
      expect.stringContaining('variable unit size (5-10 models)')
    )
    expect(squad.weapons.map((w) => w.name)).not.toContain('Broken gun')
  })

  test('round trip: an imported profile feeds simulate without fixup', () => {
    const gun = squad.weapons.find((w) => w.name === 'Test Bolt Rifle')
    if (!gun) throw new Error('missing weapon')
    const result = simulate(toEngineWeapon(gun), toEngineTarget(squad, 5))
    // Torrent D6 attacks; S8 vs T4 wounds on 2+ (5/6); AP -2 turns the 3+ into
    // a 5+, tying the 5++ invuln (fail 4/6) → p(unsaved) = 5/9 per attack.
    // Damage D6+1 ≥ 2 kills one 2W model per unsaved wound, so slain =
    // min(unsaved, 5) and only the 6-of-6 tail truncates: E = 3.5p − P(A=6)p⁶.
    const p = 5 / 9
    expect(result.meanModelsSlain).toBeCloseTo(3.5 * p - (1 / 6) * p ** 6, 10)
  })
})
