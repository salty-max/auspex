/**
 * Manual end-to-end check against a real BSData catalogue (not run in CI).
 *
 *   bun run smoke [path-to-.cat]
 *
 * Without an argument, downloads the Space Marines catalogue from BSData.
 */
import { importCatalogue } from '../src/import'

const DEFAULT_URL =
  'https://raw.githubusercontent.com/BSData/wh40k-10e/main/Imperium%20-%20Space%20Marines.cat'

const source = process.argv[2]
const xml = source
  ? await Bun.file(source).text()
  : await (await fetch(DEFAULT_URL)).text()

const { datasheets, issues } = importCatalogue(xml)

const weapons = datasheets.reduce((sum, d) => sum + d.weapons.length, 0)
console.log(`datasheets: ${datasheets.length}`)
console.log(`weapons:    ${weapons}`)
console.log(`issues:     ${issues.length}`)

const byReason = new Map<string, number>()
for (const issue of issues) {
  const key = issue.reason.replaceAll(/"[^"]*"/g, '"…"').slice(0, 60)
  byReason.set(key, (byReason.get(key) ?? 0) + 1)
}
console.log('\ntop issue shapes:')
for (const [reason, count] of [...byReason.entries()].sort(
  (a, b) => b[1] - a[1]
)) {
  console.log(`  ${String(count).padStart(4)} × ${reason}`)
}

const sample = datasheets.find((d) => d.id === 'intercessor-squad')
if (sample) {
  console.log('\nintercessor-squad:')
  console.log(JSON.stringify(sample, undefined, 2).slice(0, 1200))
}
