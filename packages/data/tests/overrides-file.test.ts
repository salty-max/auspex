import { describe, expect, test } from 'bun:test'

import { overridesFileSchema } from '../src/overrides'

describe('committed override files', () => {
  test('space-marines.yaml parses against the overrides schema', async () => {
    const raw = await Bun.file(
      new URL('../overrides/space-marines.yaml', import.meta.url).pathname
    ).text()
    const overrides = overridesFileSchema.parse(Bun.YAML.parse(raw))
    expect(overrides.length).toBeGreaterThan(0)
    for (const override of overrides) {
      expect(override.reason.length).toBeGreaterThan(10)
    }
  })
})
