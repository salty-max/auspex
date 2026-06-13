import { type Datasheet, datasheetSchema } from '@auspex/schema'
import { Database } from 'bun:sqlite'

/** Everything recorded about where an artifact came from. */
export interface Provenance {
  /** The BSData repository the catalogues came from. */
  source: string
  /** The pinned commit SHA (or ref) the catalogues were fetched at. */
  ref: string
  /** ISO timestamp of the bake. */
  bakedAt: string
  /** Version of `@auspex/importer` that produced the data. */
  importerVersion: string
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS provenance (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS datasheets (
  faction   TEXT NOT NULL,
  id        TEXT NOT NULL,
  name      TEXT NOT NULL,
  toughness INTEGER NOT NULL,
  save      INTEGER NOT NULL,
  invuln    INTEGER,
  wounds    INTEGER NOT NULL,
  models    INTEGER NOT NULL,
  points    INTEGER NOT NULL,
  json      TEXT NOT NULL,
  PRIMARY KEY (faction, id)
);
CREATE TABLE IF NOT EXISTS weapons (
  faction      TEXT NOT NULL,
  datasheet_id TEXT NOT NULL,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL,
  range        INTEGER,
  attacks      TEXT NOT NULL,
  skill        TEXT NOT NULL,
  strength     TEXT NOT NULL,
  ap           INTEGER NOT NULL,
  damage       TEXT NOT NULL,
  abilities    TEXT NOT NULL,
  FOREIGN KEY (faction, datasheet_id) REFERENCES datasheets(faction, id)
);
CREATE TABLE IF NOT EXISTS datasheet_keywords (
  faction      TEXT NOT NULL,
  datasheet_id TEXT NOT NULL,
  keyword      TEXT NOT NULL,
  FOREIGN KEY (faction, datasheet_id) REFERENCES datasheets(faction, id)
);
CREATE TABLE IF NOT EXISTS issues (
  faction TEXT NOT NULL,
  entry   TEXT NOT NULL,
  reason  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_datasheets_faction ON datasheets(faction);
CREATE INDEX IF NOT EXISTS idx_weapons_name ON weapons(name);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON datasheet_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_sheet ON datasheet_keywords(faction, datasheet_id);
`

/** Open (or create) an artifact database and ensure its schema exists. */
export function openDataDb(path: string): Database {
  const db = new Database(path, { create: true })
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec(SCHEMA_SQL)
  return db
}

/** Record the bake's provenance (overwrites previous values). */
export function writeProvenance(db: Database, provenance: Provenance): void {
  const insert = db.prepare(
    'INSERT OR REPLACE INTO provenance (key, value) VALUES (?, ?)'
  )
  for (const [key, value] of Object.entries(provenance) as [string, string][]) {
    insert.run(key, value)
  }
}

/** Read the artifact's provenance back. */
export function readProvenance(db: Database): Partial<Provenance> {
  const rows = db.prepare('SELECT key, value FROM provenance').all() as {
    key: string
    value: string
  }[]
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

/** Insert a faction's datasheets (and their weapons), replacing prior rows. */
export function writeDatasheets(
  db: Database,
  faction: string,
  datasheets: Datasheet[]
): void {
  const insertSheet = db.prepare(
    `INSERT OR REPLACE INTO datasheets
     (faction, id, name, toughness, save, invuln, wounds, models, points, json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertWeapon = db.prepare(
    `INSERT INTO weapons
     (faction, datasheet_id, name, kind, range, attacks, skill, strength, ap, damage, abilities)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertKeyword = db.prepare(
    'INSERT INTO datasheet_keywords (faction, datasheet_id, keyword) VALUES (?, ?, ?)'
  )
  const clearWeapons = db.prepare(
    'DELETE FROM weapons WHERE faction = ? AND datasheet_id = ?'
  )
  const clearKeywords = db.prepare(
    'DELETE FROM datasheet_keywords WHERE faction = ? AND datasheet_id = ?'
  )

  const write = db.transaction(() => {
    for (const sheet of datasheets) {
      insertSheet.run(
        faction,
        sheet.id,
        sheet.name,
        sheet.stats.toughness,
        sheet.stats.save,
        sheet.stats.invuln ?? null,
        sheet.stats.wounds,
        sheet.points[0].models,
        sheet.points[0].points,
        JSON.stringify(sheet)
      )
      clearWeapons.run(faction, sheet.id)
      for (const weapon of sheet.weapons) {
        insertWeapon.run(
          faction,
          sheet.id,
          weapon.name,
          weapon.kind,
          weapon.range ?? null,
          String(weapon.attacks),
          String(weapon.skill),
          String(weapon.strength),
          weapon.ap,
          String(weapon.damage),
          JSON.stringify(weapon.abilities)
        )
      }
      clearKeywords.run(faction, sheet.id)
      for (const keyword of sheet.keywords) {
        insertKeyword.run(faction, sheet.id, keyword)
      }
    }
  })
  write()
}

/** The factions present in the artifact. */
export function listFactions(db: Database): string[] {
  return (
    db
      .prepare('SELECT DISTINCT faction FROM datasheets ORDER BY faction')
      .all() as { faction: string }[]
  ).map((row) => row.faction)
}

/** Name/id pairs of a faction's datasheets. */
export function listDatasheets(
  db: Database,
  faction: string
): { id: string; name: string }[] {
  return db
    .prepare('SELECT id, name FROM datasheets WHERE faction = ? ORDER BY name')
    .all(faction) as { id: string; name: string }[]
}

/** Load one datasheet back, validated — the artifact cannot smuggle bad data. */
export function getDatasheet(
  db: Database,
  faction: string,
  id: string
): Datasheet | undefined {
  const row = db
    .prepare('SELECT json FROM datasheets WHERE faction = ? AND id = ?')
    .get(faction, id) as { json: string } | null
  if (!row) return undefined
  return datasheetSchema.parse(JSON.parse(row.json))
}

/** The filters the army builder's unit picker composes. */
export interface DatasheetFilter {
  /** Restrict to one faction. */
  faction?: string
  /** Require all of these keywords (e.g. `['CHARACTER', 'EPIC HERO']`). */
  keywords?: string[]
  /** Cap on the datasheet's base-size points. */
  maxPoints?: number
}

/** A datasheet summary for the picker. */
export interface DatasheetSummary {
  faction: string
  id: string
  name: string
  points: number
}

/**
 * Find datasheets matching a filter, ordered by name. Keyword filters require
 * every listed keyword (AND), counted off the indexed `datasheet_keywords` table
 * so the query stays a plain index scan rather than a JSON walk.
 */
export function findDatasheets(
  db: Database,
  filter: DatasheetFilter = {}
): DatasheetSummary[] {
  const where: string[] = []
  const params: (string | number)[] = []

  if (filter.faction !== undefined) {
    where.push('d.faction = ?')
    params.push(filter.faction)
  }
  if (filter.maxPoints !== undefined) {
    where.push('d.points <= ?')
    params.push(filter.maxPoints)
  }

  const keywords = filter.keywords ?? []
  if (keywords.length > 0) {
    const placeholders = keywords.map(() => '?').join(', ')
    where.push(`(
      SELECT COUNT(DISTINCT k.keyword) FROM datasheet_keywords k
      WHERE k.faction = d.faction AND k.datasheet_id = d.id
        AND k.keyword IN (${placeholders})
    ) = ?`)
    params.push(...keywords, keywords.length)
  }

  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  return db
    .prepare(
      `SELECT faction, id, name, points FROM datasheets d ${clause} ORDER BY name`
    )
    .all(...params) as DatasheetSummary[]
}

/** The distinct keywords present, optionally scoped to one faction, for filter UIs. */
export function listKeywords(db: Database, faction?: string): string[] {
  const rows = (
    faction === undefined
      ? db.prepare(
          'SELECT DISTINCT keyword FROM datasheet_keywords ORDER BY keyword'
        )
      : db.prepare(
          'SELECT DISTINCT keyword FROM datasheet_keywords WHERE faction = ? ORDER BY keyword'
        )
  ).all(...(faction === undefined ? [] : [faction])) as { keyword: string }[]
  return rows.map((row) => row.keyword)
}
