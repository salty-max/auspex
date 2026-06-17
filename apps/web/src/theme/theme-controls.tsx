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
      value={palette}
      onValueChange={(value) => setPalette(value as Palette)}
    >
      <Select.Trigger aria-label={t('palette.label')} />
      <Select.Content>
        {PALETTES.map((value) => (
          <Select.Item key={value} value={value}>
            {t(`palette.${value}`)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
