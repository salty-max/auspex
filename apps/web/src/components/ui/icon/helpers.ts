import type { IconName } from '@/components/ui/icon/registry.gen'
import type { Palette } from '@/theme/theme'

/**
 * A profile characteristic that has a glyph — the unit stat line plus the
 * weapon profile, matching the simulator's form fields. `skill` resolves to the
 * ballistic-skill reticle by default; reach for `general/weapon-skill` directly
 * when the melee context is known.
 */
export type StatKey =
  | 'attacks'
  | 'skill'
  | 'strength'
  | 'ap'
  | 'damage'
  | 'toughness'
  | 'save'
  | 'wounds'
  | 'models'

const STAT_ICON: Record<StatKey, IconName> = {
  attacks: 'general/attacks',
  skill: 'general/ballistic-skill',
  strength: 'general/strength',
  ap: 'general/armour-penetration',
  damage: 'general/damage',
  toughness: 'general/toughness',
  save: 'general/save',
  wounds: 'general/wounds',
  models: 'general/user',
}

/** The glyph standing in for a profile characteristic. */
export function statIcon(stat: StatKey): IconName {
  return STAT_ICON[stat]
}

/** The crest for a theme palette (its namesake faction). */
const PALETTE_ICON: Record<Palette, IconName> = {
  mechanicus: 'imperium/adeptus-mechanicus',
  ultramarines: 'imperium/ultramarines',
  sororitas: 'imperium/adepta-sororitas',
  necrons: 'necrons/necrons',
  tau: 'tau/tau',
  eldar: 'aeldari/aeldari',
  chaos: 'chaos/chaos-star-01',
}

/** The faction crest for a palette. */
export function paletteIcon(palette: Palette): IconName {
  return PALETTE_ICON[palette]
}

/** Slugify a faction name (lower-case kebab, apostrophes dropped) for lookup. */
function slugify(faction: string): string {
  return faction
    .trim()
    .toLowerCase()
    .replaceAll(/['’]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}

// Faction display names (as the API returns them), keyed by their kebab slug —
// `factionIcon` slugifies its input the same way, so apostrophe/spacing variants
// ("T'au Empire" → `tau-empire`) still match. Covers every 10e faction we have a
// crest for; the odd one out (Leagues of Votann) has no glyph in the set yet and
// falls through to `undefined`. Sub-factions (dynasties, septs, craftworlds,
// undivided legions, chapters, klans) are cosmetic in 10e — referenced directly
// by `category/slug` where a feature needs them, not resolved here.
const FACTION_ICON: Record<string, IconName> = {
  // Imperium
  'adepta-sororitas': 'imperium/adepta-sororitas',
  'adeptus-custodes': 'imperium/adeptus-custodes',
  'adeptus-mechanicus': 'imperium/adeptus-mechanicus',
  'adeptus-titanicus': 'imperium/collegia-titanica',
  'agents-of-the-imperium': 'imperium/inquisition-1',
  'astra-militarum': 'imperium/astra-militarum',
  'black-templars': 'imperium/black-templars',
  'blood-angels': 'imperium/blood-angels',
  'dark-angels': 'imperium/dark-angels',
  deathwatch: 'imperium/deathwatch',
  'grey-knights': 'imperium/grey-knights',
  'imperial-fists': 'imperium/imperial-fists',
  'imperial-knights': 'imperium/imperial-knights',
  'iron-hands': 'imperium/iron-hands',
  'raven-guard': 'imperium/raven-guard',
  salamanders: 'imperium/salamanders',
  'space-marines': 'imperium/adeptus-astartes',
  'space-wolves': 'imperium/space-wolves',
  ultramarines: 'imperium/ultramarines',
  'white-scars': 'imperium/white-scars',

  // Chaos
  'chaos-daemons': 'chaos/chaos-daemons',
  'chaos-knights': 'chaos/questor-traitoris',
  'chaos-space-marines': 'chaos/heretic-astartes',
  'death-guard': 'chaos/death-guard',
  'emperors-children': 'chaos/emperor-s-children',
  'thousand-sons': 'chaos/thousand-sons',
  'titanicus-traitoris': 'chaos/titanicus-traitoris',
  'world-eaters': 'chaos/world-eaters',

  // Xenos
  aeldari: 'aeldari/aeldari',
  drukhari: 'druhkari/dark-eldar',
  'genestealer-cults': 'genestealer-cult/genestealer-cults',
  necrons: 'necrons/necrons',
  orks: 'orks/orks',
  'tau-empire': 'tau/tau',
  tyranids: 'tyranid/tyranids',
}

/**
 * The faction crest for a faction display name, or `undefined` when no crest
 * exists for it yet. Matching is case-, spacing- and apostrophe-insensitive.
 */
export function factionIcon(faction: string): IconName | undefined {
  return FACTION_ICON[slugify(faction)]
}
