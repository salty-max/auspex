/** The locales the UI ships translations for. */
export const SUPPORTED_LOCALES = ['en', 'fr'] as const

/** A supported UI locale. */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** The locale to fall back to when none is detected. */
export const DEFAULT_LOCALE: Locale = 'en'

/** Type guard narrowing an arbitrary string to a supported locale. */
export function isSupportedLocale(
  input: string | null | undefined
): input is Locale {
  return (
    input != null && (SUPPORTED_LOCALES as readonly string[]).includes(input)
  )
}
