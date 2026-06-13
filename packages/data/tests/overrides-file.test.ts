import { readdirSync } from 'node:fs'

import { describe, expect, test } from 'bun:test'

import { overridesFileSchema } from '../src/overrides'

const overridesDir = new URL('../overrides/', import.meta.url).pathname
const files = readdirSync(overridesDir).filter((f) => f.endsWith('.yaml'))

describe('committed override files', () => {
  test('there is at least one override file', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  test.each(files)('%s parses and every entry has a reason', async (file) => {
    const raw = await Bun.file(`${overridesDir}${file}`).text()
    const overrides = overridesFileSchema.parse(Bun.YAML.parse(raw))
    expect(overrides.length).toBeGreaterThan(0)
    for (const override of overrides) {
      expect(override.reason.length).toBeGreaterThan(10)
    }
  })
})
