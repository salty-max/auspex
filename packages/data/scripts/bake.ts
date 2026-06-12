/**
 * Bake BSData catalogues into the SQLite artifact (manual, not run in CI):
 *
 *   bun run bake [ref]
 *
 * `ref` is a BSData/wh40k-10e commit SHA or branch (default: main). Catalogues
 * to bake are listed below; overrides come from overrides/<slug>.yaml.
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

import { bakeCatalogue, openDataDb, stampProvenance } from '../src/index'
import { overridesFileSchema } from '../src/overrides'

const SOURCE = 'BSData/wh40k-10e'
const CATALOGUES = ['Imperium - Space Marines']

const ref = process.argv[2] ?? 'main'
const here = path.dirname(new URL(import.meta.url).pathname)
const artifactDir = path.join(here, '..', 'artifacts')
const dbPath = path.join(artifactDir, 'auspex.sqlite')

mkdirSync(artifactDir, { recursive: true })
rmSync(dbPath, { force: true })
const db = openDataDb(dbPath)

for (const name of CATALOGUES) {
  const url = `https://raw.githubusercontent.com/${SOURCE}/${ref}/${encodeURIComponent(name)}.cat`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status}`)
  }
  const xml = await response.text()

  const slug = name
    .toLowerCase()
    .replace(/^.*- /, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
  const overridesPath = path.join(here, '..', 'overrides', `${slug}.yaml`)
  const overrides = existsSync(overridesPath)
    ? overridesFileSchema.parse(
        Bun.YAML.parse(await Bun.file(overridesPath).text())
      )
    : []

  const report = bakeCatalogue(db, { xml, overrides })
  console.log(
    `${report.faction}: ${report.datasheets} datasheets, ${report.weapons} weapons, ` +
      `${report.issues} issues, ${report.overridesApplied} overrides applied`
  )
}

stampProvenance(db, {
  source: `https://github.com/${SOURCE}`,
  ref,
  bakedAt: new Date().toISOString(),
  importerVersion: '0.0.0',
})
db.close()
console.log(`\nartifact: ${dbPath}`)
