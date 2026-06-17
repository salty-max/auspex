import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { DEFAULT_LOCALE } from '@/features/localization/domain/locale'
import { en } from '@/features/localization/resources/en'
import { fr } from '@/features/localization/resources/fr'
import { languageDetector } from '@/lib/language-detector'

const resources = { en, fr } as const
type Resources = typeof resources

/** Initialise i18next once, before any component renders. */
export function initI18n(): void {
  void i18n
    .use(initReactI18next)
    .use(languageDetector)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resources['en']
  }
}
