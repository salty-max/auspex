import { useTranslation } from 'react-i18next'

import { Toggle } from '@/components/ui/toggle'
import { useTheme } from '@/theme/theme-provider'

/** Toggles the CRT screen filter (scanlines, vignette, flicker). */
export function CrtToggle() {
  const { t } = useTranslation('theme')
  const { crt, setCrt } = useTheme()

  return (
    <Toggle
      pressed={crt}
      onPressedChange={setCrt}
      aria-label={t('crt.label')}
      title={t('crt.label')}
    >
      CRT
    </Toggle>
  )
}
