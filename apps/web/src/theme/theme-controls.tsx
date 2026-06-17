import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui/select'
import { type Palette, PALETTES } from '@/theme/theme'
import { useTheme } from '@/theme/theme-provider'

/** Phosphor (palette) selector for the cogitator. */
export function ThemeControls() {
  const { t } = useTranslation('theme')
  const { palette, setPalette } = useTheme()

  return (
    <Select
      aria-label={t('palette.label')}
      value={palette}
      onChange={(e) => setPalette(e.currentTarget.value as Palette)}
    >
      {PALETTES.map((value) => (
        <option key={value} value={value}>
          {t(`palette.${value}`)}
        </option>
      ))}
    </Select>
  )
}
