import type { Datasheet } from '@auspex/schema'
import type { Database } from 'bun:sqlite'

import { getDatasheet, listDatasheets, listFactions } from './db'

/** Look a datasheet up by faction and name. Returns `undefined` when unknown. */
export type DatasheetLookup = (
  faction: string,
  name: string
) => Datasheet | undefined

/** Lowercase and collapse whitespace, so user-typed names match baked names. */
function normalize(text: string): string {
  return text.trim().toLowerCase().replaceAll(/\s+/g, ' ')
}

/**
 * A name-based datasheet lookup over an artifact database, with normalized
 * (case- and whitespace-insensitive) matching on both faction and datasheet name.
 * Indexes lazily per faction on first use. This is the source the resolver binds a
 * parsed list against.
 */
export function datasheetSource(db: Database): DatasheetLookup {
  const factionNames = new Map<string, string>()
  for (const faction of listFactions(db)) {
    factionNames.set(normalize(faction), faction)
  }

  const nameIndex = new Map<string, Map<string, string>>()

  return (faction, name) => {
    const realFaction = factionNames.get(normalize(faction))
    if (!realFaction) return undefined

    let names = nameIndex.get(realFaction)
    if (!names) {
      names = new Map<string, string>()
      for (const sheet of listDatasheets(db, realFaction)) {
        names.set(normalize(sheet.name), sheet.id)
      }
      nameIndex.set(realFaction, names)
    }

    const id = names.get(normalize(name))
    return id ? getDatasheet(db, realFaction, id) : undefined
  }
}
