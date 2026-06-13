/**
 * Bake every BSData 10e faction into the SQLite artifact (manual, not run in CI):
 *
 *   bun run bake [ref]
 *
 * `ref` is a BSData/wh40k-10e commit SHA or branch; it defaults to the pinned ref
 * below so bakes are reproducible. Every `.cat` in the repo is fetched; faction
 * catalogues are baked with their library dependencies, and overrides come from
 * overrides/<faction-slug>.yaml.
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

import { catalogueMeta } from '@auspex/importer'

import {
  type BakeInput,
  bakeAll,
  openDataDb,
  stampProvenance,
} from '../src/index'
import { overridesFileSchema } from '../src/overrides'

const SOURCE = 'BSData/wh40k-10e'
/** Pinned for reproducibility — bump deliberately when refreshing the data. */
const PINNED_REF = '9e3bb4b947c6fcc429dac3518d6fc8f74c095024'

const ref = process.argv[2] ?? PINNED_REF
const here = path.dirname(new URL(import.meta.url).pathname)
const artifactDir = path.join(here, '..', 'artifacts')
const dbPath = path.join(artifactDir, 'auspex.sqlite')

function slug(faction: string): string {
  return faction
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}

async function loadOverrides(faction: string): Promise<BakeInput['overrides']> {
  const file = path.join(here, '..', 'overrides', `${slug(faction)}.yaml`)
  if (!existsSync(file)) return undefined
  return overridesFileSchema.parse(Bun.YAML.parse(await Bun.file(file).text()))
}

// List every catalogue in the repo at the pinned ref.
const tree = (await (
  await fetch(`https://api.github.com/repos/${SOURCE}/git/trees/${ref}`)
).json()) as { tree: { path: string }[] }
const files = tree.tree
  .map((node) => node.path)
  .filter((p) => p.endsWith('.cat'))

const catalogues: BakeInput[] = []
for (const file of files) {
  const url = `https://raw.githubusercontent.com/${SOURCE}/${ref}/${encodeURIComponent(file)}`
  const xml = await (await fetch(url)).text()
  const overrides = await loadOverrides(catalogueMeta(xml).faction)
  catalogues.push({ xml, ...(overrides && { overrides }) })
}

mkdirSync(artifactDir, { recursive: true })
rmSync(dbPath, { force: true })
const db = openDataDb(dbPath)

const reports = bakeAll(db, catalogues)
let totalDs = 0
let totalIssues = 0
for (const r of reports.sort((a, b) => b.datasheets - a.datasheets)) {
  totalDs += r.datasheets
  totalIssues += r.issues
  console.log(
    `${r.faction.padEnd(28)} ${String(r.datasheets).padStart(3)}ds ` +
      `${String(r.weapons).padStart(4)}w ${String(r.issues).padStart(3)}i ` +
      `${r.overridesApplied} ovr`
  )
}

stampProvenance(db, {
  source: `https://github.com/${SOURCE}`,
  ref,
  bakedAt: new Date().toISOString(),
  importerVersion: '0.0.0',
})
db.close()
console.log(
  `\n${reports.length} factions, ${totalDs} datasheets, ${totalIssues} issues`
)
console.log(`artifact: ${dbPath}`)
