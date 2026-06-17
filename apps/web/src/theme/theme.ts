/** Every selectable palette; `'mechanicus'` is the default phosphor, the rest factions. */
export const PALETTES = [
  'mechanicus',
  'ultramarines',
  'sororitas',
  'necrons',
  'tau',
  'eldar',
  'chaos',
] as const

/** Active palette (phosphor colour of the cogitator). */
export type Palette = (typeof PALETTES)[number]

/** Type guard narrowing an arbitrary string to a known palette. */
export function isPalette(value: string | null | undefined): value is Palette {
  return value != null && (PALETTES as readonly string[]).includes(value)
}
