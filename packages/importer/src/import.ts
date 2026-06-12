import {
  type Datasheet,
  datasheetSchema,
  type WeaponProfile,
} from '@auspex/schema'

import {
  attr,
  children,
  indexById,
  parseCatalogueXml,
  text,
  type XmlNode,
} from './catalogue'
import {
  parseAp,
  parseDice,
  parseInches,
  parseInt10,
  parseRoll,
  parseWeaponKeywords,
} from './values'

/** Something the importer could not map — reported, never silently dropped. */
export interface ImportIssue {
  /** The unit (or `unit › weapon`) the issue belongs to. */
  entry: string
  reason: string
}

/** The result of importing one catalogue. */
export interface ImportResult {
  datasheets: Datasheet[]
  issues: ImportIssue[]
}

/** Import a BSData catalogue file (`.cat` XML content) into schema datasheets. */
export function importCatalogue(xml: string): ImportResult {
  const catalogue = parseCatalogueXml(xml)
  const shared = indexById(catalogue)
  const faction = (attr(catalogue, 'name') ?? 'Unknown').replace(/^.*- /, '')

  const datasheets: Datasheet[] = []
  const issues: ImportIssue[] = []

  for (const entry of children(
    catalogue,
    'sharedSelectionEntries',
    'selectionEntry'
  )) {
    const type = attr(entry, 'type')
    if (type !== 'unit' && type !== 'model') continue
    const name = attr(entry, 'name') ?? '(unnamed)'

    try {
      const sheet = buildDatasheet(entry, name, faction, shared, issues)
      if (sheet) datasheets.push(sheet)
    } catch (error) {
      issues.push({ entry: name, reason: String(error) })
    }
  }

  return { datasheets, issues }
}

/** Collect the unit's subtree, following entry/info links (cycle-safe). */
function collectNodes(
  root: XmlNode,
  shared: Map<string, XmlNode>
): { profiles: XmlNode[]; modelEntries: XmlNode[] } {
  const profiles: XmlNode[] = []
  const modelEntries: XmlNode[] = []
  const seen = new Set<XmlNode>()

  const walk = (node: XmlNode): void => {
    if (seen.has(node)) return
    seen.add(node)

    profiles.push(...children(node, 'profiles', 'profile'))
    for (const child of children(node, 'selectionEntries', 'selectionEntry')) {
      if (attr(child, 'type') === 'model') modelEntries.push(child)
      walk(child)
    }
    for (const group of children(
      node,
      'selectionEntryGroups',
      'selectionEntryGroup'
    )) {
      walk(group)
    }
    for (const link of [
      ...children(node, 'entryLinks', 'entryLink'),
      ...children(node, 'infoLinks', 'infoLink'),
    ]) {
      const target = shared.get(attr(link, 'targetId') ?? '')
      if (!target || seen.has(target)) continue
      // An infoLink can point straight at a shared profile (the common pattern
      // for invulnerable saves); anything else is an entry to walk into.
      if (attr(target, 'typeName') !== undefined) {
        seen.add(target)
        profiles.push(target)
      } else {
        walk(target)
      }
    }
  }

  walk(root)
  return { profiles, modelEntries }
}

function characteristics(profile: XmlNode): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of children(profile, 'characteristics', 'characteristic')) {
    const name = attr(c, 'name')
    if (name) map.set(name, text(c))
  }
  return map
}

function buildWeapon(
  profile: XmlNode,
  unit: string,
  issues: ImportIssue[]
): WeaponProfile | undefined {
  const name = attr(profile, 'name') ?? '(unnamed weapon)'
  const kind =
    attr(profile, 'typeName') === 'Melee Weapons' ? 'melee' : 'ranged'
  const c = characteristics(profile)

  const fail = (reason: string): undefined => {
    issues.push({ entry: `${unit} › ${name}`, reason })
    return undefined
  }

  const attacks = parseDice(c.get('A') ?? '')
  if (attacks === undefined) return fail(`unparseable attacks "${c.get('A')}"`)
  const strength = parseInt10(c.get('S') ?? '')
  if (strength === undefined)
    return fail(`unparseable strength "${c.get('S')}"`)
  const ap = parseAp(c.get('AP') ?? '')
  if (ap === undefined) return fail(`unparseable AP "${c.get('AP')}"`)
  const damage = parseDice(c.get('D') ?? '')
  if (damage === undefined) return fail(`unparseable damage "${c.get('D')}"`)

  const { abilities, torrent } = parseWeaponKeywords(c.get('Keywords') ?? '')
  const skillRaw = c.get(kind === 'melee' ? 'WS' : 'BS') ?? ''
  const skill = torrent ? ('torrent' as const) : parseRoll(skillRaw)
  if (skill === undefined) return fail(`unparseable skill "${skillRaw}"`)

  const range = parseInches(c.get('Range') ?? '')

  return {
    name,
    kind,
    ...(range !== undefined && { range }),
    attacks,
    skill,
    strength,
    ap,
    damage,
    abilities,
  }
}

function buildDatasheet(
  entry: XmlNode,
  name: string,
  faction: string,
  shared: Map<string, XmlNode>,
  issues: ImportIssue[]
): Datasheet | undefined {
  const { profiles, modelEntries } = collectNodes(entry, shared)

  const unitProfiles = profiles.filter((p) => attr(p, 'typeName') === 'Unit')
  if (unitProfiles.length === 0) {
    issues.push({ entry: name, reason: 'no Unit statline profile found' })
    return undefined
  }
  const stats = characteristics(unitProfiles[0])

  // Weapons: linked entries make duplicates common — keep the first of each name.
  const weapons = new Map<string, WeaponProfile>()
  for (const profile of profiles) {
    const typeName = attr(profile, 'typeName')
    if (typeName !== 'Ranged Weapons' && typeName !== 'Melee Weapons') continue
    const weapon = buildWeapon(profile, name, issues)
    if (weapon && !weapons.has(weapon.name)) weapons.set(weapon.name, weapon)
  }

  // Abilities stay verbatim; the invulnerable save is lifted into the statline.
  let invuln: number | undefined
  const abilities: { name: string; description: string }[] = []
  for (const profile of profiles) {
    if (attr(profile, 'typeName') !== 'Abilities') continue
    const abilityName = attr(profile, 'name') ?? '(unnamed ability)'
    const description = characteristics(profile).get('Description') ?? ''
    if (/^invulnerable save/i.test(abilityName)) {
      invuln ??= parseRoll(/(\d\+)/.exec(description)?.[1] ?? '')
      continue
    }
    abilities.push({ name: abilityName, description })
  }

  // Base unit size: the sum of the model entries' minimum counts.
  let models = 0
  let maxModels = 0
  for (const model of modelEntries) {
    for (const constraint of children(model, 'constraints', 'constraint')) {
      const value = Number.parseInt(attr(constraint, 'value') ?? '0', 10)
      if (attr(constraint, 'type') === 'min') models += value
      if (attr(constraint, 'type') === 'max') maxModels += value
    }
  }
  if (models <= 0) models = 1
  if (maxModels > models) {
    issues.push({
      entry: name,
      reason: `variable unit size (${models}-${maxModels} models); only the base-size points are imported`,
    })
  }

  const points = children(entry, 'costs', 'cost')
    .filter((cost) => attr(cost, 'name') === 'pts')
    .map((cost) => Number.parseInt(attr(cost, 'value') ?? '0', 10))

  const candidate = {
    id: slug(name),
    name,
    faction,
    keywords: children(entry, 'categoryLinks', 'categoryLink')
      .map((link) => (attr(link, 'name') ?? '').replace(/^Faction: /, ''))
      .filter((keyword) => keyword.length > 0)
      .map((keyword) => keyword.toUpperCase()),
    stats: {
      ...(parseInches(stats.get('M') ?? '') !== undefined && {
        movement: parseInches(stats.get('M') ?? ''),
      }),
      toughness: parseInt10(stats.get('T') ?? ''),
      save: parseRoll(stats.get('SV') ?? ''),
      ...(invuln !== undefined && { invuln }),
      wounds: parseInt10(stats.get('W') ?? ''),
      ...(parseRoll(stats.get('LD') ?? '') !== undefined && {
        leadership: parseRoll(stats.get('LD') ?? ''),
      }),
      ...(parseInt10(stats.get('OC') ?? '') !== undefined && {
        objectiveControl: parseInt10(stats.get('OC') ?? ''),
      }),
    },
    weapons: [...weapons.values()],
    abilities,
    points: [{ models, points: points[0] ?? 0 }],
  }

  const parsed = datasheetSchema.safeParse(candidate)
  if (!parsed.success) {
    issues.push({
      entry: name,
      reason: `schema rejection: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    })
    return undefined
  }
  return parsed.data
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}
