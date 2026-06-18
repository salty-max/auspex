/**
 * One-shot import of the raw 40k SVG set into the app, cleaned and slugified.
 *
 * Usage: bun run scripts/import-icons.ts [sourceDir]
 * Default source: ~/Downloads/icons/wh40k
 *
 * Reads the (messily-named) source SVGs, runs SVGO to flatten <style>/class
 * fills to `currentColor`, prefix internal ids, and strip titles/dimensions
 * (keeping viewBox), then writes slugified files to
 * src/assets/icons/<category>/<slug>.svg. Category is
 * the top-level folder (Xenos/<faction> → the faction). Slug collisions are
 * logged and the first wins. The General stat glyphs are additionally recentred
 * into a uniform square viewport so a row of them reads evenly.
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, relative } from 'node:path'

import { type Config, optimize } from 'svgo'

const SOURCE = process.argv[2] ?? join(homedir(), 'Downloads/icons/wh40k')
const OUT = join(import.meta.dir, '../src/assets/icons')

function slug(value: string): string {
  return value
    .replace(/\.svg$/i, '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function categoryFor(relPath: string): string {
  const parts = relPath.split('/')
  if (parts[0] === 'Xenos' && parts.length > 2) return slug(parts[1])
  return slug(parts[0])
}

// Per-icon config: `prefixIds` makes any internal ids (clip paths, gradients)
// unique so they don't collide when several inline icons share the page's id
// namespace.
function configFor(prefix: string): Config {
  return {
    plugins: [
      // Adobe Illustrator exports embed a base64 copy of the source document in
      // an <i:pgf> block — kilobytes of dead metadata. Its namespace is the XML
      // entity `&ns_ai;`, which the default removeEditorsNSData (matching the
      // literal Adobe URL) misses, so feed it the entity to strip the editor data.
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeEditorsNSData: { additionalNamespaces: ['&ns_ai;'] },
          },
        },
      },
      { name: 'inlineStyles', params: { onlyMatchedOnce: false } },
      'convertStyleToAttrs',
      { name: 'convertColors', params: { currentColor: true } },
      'removeStyleElement',
      'removeDimensions',
      'removeTitle',
      { name: 'removeAttrs', params: { attrs: ['class', 'data-name'] } },
      { name: 'prefixIds', params: { prefix } },
    ],
  }
}

// The General profile glyphs (catalogued as the stat line in the web app) are
// drawn at wildly different aspect ratios, so at one font size a thin glyph
// towers over a wide one. They are recentred into a shared square viewport at a
// uniform height so a row of them reads evenly; every other icon keeps its
// natural bounds. Their source viewBox is tight to the art, so it doubles as the
// bounding box — no per-glyph measurement needed.
const NORMALIZED_STATS = new Set([
  'attacks',
  'ballistic-skill',
  'weapon-skill',
  'strength',
  'armour-penetration',
  'damage',
  'toughness',
  'save',
  'wounds',
  'leadership',
  'move',
  'range',
  'melee',
  'user',
])
const NORM_BOX = 32
const NORM_HEIGHT = 22

/**
 * Recentre a tight-viewBox glyph into a `NORM_BOX` square at `NORM_HEIGHT`,
 * wrapping its content in the centring transform. Assumes the viewBox equals the
 * art bounds (true for the normalized stat set).
 */
function normalizeViewport(svg: string): string {
  const vb = /viewBox="([^"]*)"/.exec(svg)?.[1]
  const [, , w, h] = vb?.split(/\s+/).map(Number) ?? []
  if (!w || !h) return svg
  const scale = NORM_HEIGHT / h
  const tx = (NORM_BOX - w * scale) / 2
  const ty = (NORM_BOX - NORM_HEIGHT) / 2
  const open = `<g transform="translate(${+tx.toFixed(3)} ${+ty.toFixed(3)}) scale(${+scale.toFixed(5)})">`
  return svg
    .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${NORM_BOX} ${NORM_BOX}"`)
    .replace(/(<svg[^>]*>)/, `$1${open}`)
    .replace(/<\/svg>\s*$/, '</g></svg>')
}

function* walk(dir: string, base: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full, base)
    else if (entry.toLowerCase().endsWith('.svg')) yield relative(base, full)
  }
}

rmSync(OUT, { recursive: true, force: true })

const seen = new Map<string, string>()
const collisions: string[] = []
let written = 0

for (const rel of walk(SOURCE, SOURCE)) {
  const category = categoryFor(rel)
  const name = slug(rel.split('/').pop() ?? '')
  if (!name) continue
  const key = `${category}/${name}`
  const prior = seen.get(key)
  if (prior) {
    collisions.push(`${rel}  ->  ${key}  (kept ${prior})`)
    continue
  }
  seen.set(key, rel)

  // Drop the Illustrator <switch> fallback <foreignObject> (an empty editor-data
  // ref once removeEditorsNSData has stripped its contents); the real glyph is
  // its sibling <g>.
  const raw = readFileSync(join(SOURCE, rel), 'utf8').replaceAll(
    /<foreignObject\b[\s\S]*?<\/foreignObject>/g,
    ''
  )
  let { data } = optimize(raw, {
    path: rel,
    ...configFor(`${category}-${name}`),
  })
  if (category === 'general' && NORMALIZED_STATS.has(name)) {
    data = normalizeViewport(data)
  }
  const dir = join(OUT, category)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.svg`), data)
  written++
}

console.log(`wrote ${written} icons → ${relative(process.cwd(), OUT)}`)
if (collisions.length) {
  console.log(`\n${collisions.length} slug collisions (first kept):`)
  for (const c of collisions) console.log('  ' + c)
}
