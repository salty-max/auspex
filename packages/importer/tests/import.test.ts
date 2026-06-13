import { simulate } from '@auspex/engine'
import { toEngineTarget, toEngineWeapon } from '@auspex/schema'
import { describe, expect, test } from 'bun:test'

import { catalogueMeta } from '../src/catalogue'
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

const thinFaction = await Bun.file(
  new URL('fixtures/thin-faction.cat', import.meta.url).pathname
).text()
const library = await Bun.file(
  new URL('fixtures/library.cat', import.meta.url).pathname
).text()

describe('importCatalogue — linked libraries', () => {
  test('a thin faction resolves its roster from a library', () => {
    const { datasheets } = importCatalogue(thinFaction, [library])
    const names = datasheets.map((d) => d.name).sort()
    expect(names).toEqual(['Library Squad', 'Native Squad'])

    const linked = datasheets.find((d) => d.name === 'Library Squad')
    // The whole datasheet — statline, weapon and points — comes from the library.
    expect(linked?.stats).toMatchObject({ toughness: 4, save: 3, wounds: 2 })
    expect(linked?.weapons[0]?.name).toBe('Library Bolter')
    expect(linked?.points).toEqual([{ models: 5, points: 80 }])
  })

  test('without the library, the linked unit is missing but direct units remain', () => {
    const { datasheets } = importCatalogue(thinFaction)
    expect(datasheets.map((d) => d.name)).toEqual(['Native Squad'])
  })

  test('passing a library redundantly does not duplicate units', () => {
    const { datasheets } = importCatalogue(thinFaction, [library, library])
    expect(datasheets).toHaveLength(2)
  })

  test('a self-contained catalogue is unchanged when given a library', () => {
    const withLib = importCatalogue(xml, [library])
    expect(withLib.datasheets.map((d) => d.id)).toEqual(
      datasheets.map((d) => d.id)
    )
  })
})

describe('catalogueMeta', () => {
  test('reads a faction catalogue and its library dependency', () => {
    expect(catalogueMeta(thinFaction)).toEqual({
      id: 'thin-faction',
      name: 'Imperium - Test Legion',
      faction: 'Test Legion',
      isLibrary: false,
      dependencies: ['test-library'],
    })
  })

  test('flags a library catalogue', () => {
    const meta = catalogueMeta(library)
    expect(meta.isLibrary).toBe(true)
    expect(meta.dependencies).toEqual([])
  })
})

describe('importCatalogue — statless entries', () => {
  const cat = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue xmlns="http://www.battlescribe.net/schema/catalogueSchema" id="stat-cat" name="Xenos - Mob" type="catalogue">
  <sharedSelectionEntries>
    <selectionEntry type="unit" import="true" name="Real Mob" id="real-unit">
      <profiles>
        <profile name="Real Mob" typeId="t-unit" typeName="Unit">
          <characteristics>
            <characteristic name="T">5</characteristic>
            <characteristic name="SV">6+</characteristic>
            <characteristic name="W">1</characteristic>
          </characteristics>
        </profile>
      </profiles>
      <selectionEntries>
        <selectionEntry type="model" import="true" name="Mobster" id="mob-model">
          <constraints><constraint type="min" value="10" id="m-c"/></constraints>
        </selectionEntry>
      </selectionEntries>
      <costs><cost name="pts" value="80"/></costs>
    </selectionEntry>
    <selectionEntry type="model" import="true" name="Component Boy" id="comp-model">
      <constraints><constraint type="min" value="1" id="c-c"/></constraints>
    </selectionEntry>
    <selectionEntry type="unit" import="true" name="Broken Unit" id="broken-unit">
      <costs><cost name="pts" value="50"/></costs>
    </selectionEntry>
  </sharedSelectionEntries>
</catalogue>`

  test('a component model with no statline is skipped without an issue', () => {
    const { datasheets, issues } = importCatalogue(cat)
    expect(datasheets.map((d) => d.name)).toEqual(['Real Mob'])
    // The component model is silently skipped...
    expect(issues.some((i) => i.entry === 'Component Boy')).toBe(false)
    // ...but a unit entry that genuinely lacks a statline is still reported.
    expect(issues).toContainEqual({
      entry: 'Broken Unit',
      reason: 'no Unit statline profile found',
    })
  })
})

describe('importCatalogue — random Strength', () => {
  const randomStrengthCat = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue xmlns="http://www.battlescribe.net/schema/catalogueSchema" id="zzap-cat" name="Xenos - Zzap" type="catalogue">
  <sharedSelectionEntries>
    <selectionEntry type="unit" import="true" name="Zzap Crew" id="zzap-unit">
      <profiles>
        <profile name="Zzap Crew" typeId="t-unit" typeName="Unit">
          <characteristics>
            <characteristic name="T">5</characteristic>
            <characteristic name="SV">5+</characteristic>
            <characteristic name="W">3</characteristic>
          </characteristics>
        </profile>
      </profiles>
      <selectionEntries>
        <selectionEntry type="model" import="true" name="Crew" id="zzap-model">
          <constraints><constraint type="min" value="1" id="z-c"/></constraints>
          <profiles>
            <profile name="Zzap gun" typeId="t-ranged" typeName="Ranged Weapons">
              <characteristics>
                <characteristic name="Range">36"</characteristic>
                <characteristic name="A">1</characteristic>
                <characteristic name="BS">5+</characteristic>
                <characteristic name="S">2D6</characteristic>
                <characteristic name="AP">-2</characteristic>
                <characteristic name="D">D3</characteristic>
                <characteristic name="Keywords">-</characteristic>
              </characteristics>
            </profile>
          </profiles>
        </selectionEntry>
      </selectionEntries>
      <costs><cost name="pts" value="60"/></costs>
    </selectionEntry>
  </sharedSelectionEntries>
</catalogue>`

  test('a 2D6-Strength weapon imports instead of dropping', () => {
    const { datasheets, issues } = importCatalogue(randomStrengthCat)
    expect(issues).toEqual([])
    const zzap = datasheets[0]?.weapons.find((w) => w.name === 'Zzap gun')
    expect(zzap?.strength).toBe('2D6')
  })
})
