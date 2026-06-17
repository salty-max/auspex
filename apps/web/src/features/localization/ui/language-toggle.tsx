import { useTranslation } from 'react-i18next'

import { Segmented } from '@/components/ui/segmented'
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from '@/features/localization/domain/locale'

/** Animated switch between the supported UI languages. */
export function LanguageToggle() {
  const { i18n, t } = useTranslation('theme')
  const active = isSupportedLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LOCALE

  return (
    <Segmented<Locale>
      ariaLabel={t('language.label')}
      value={active}
      options={SUPPORTED_LOCALES.map((value) => ({ value, label: value }))}
      onChange={(value) => void i18n.changeLanguage(value)}
    />
  )
}
