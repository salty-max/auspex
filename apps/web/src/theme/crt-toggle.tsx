import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/theme-provider'

/** Toggles the CRT screen filter (scanlines, vignette, flicker). */
export function CrtToggle() {
  const { t } = useTranslation('theme')
  const { crt, setCrt } = useTheme()

  return (
    <button
      type="button"
      aria-pressed={crt}
      aria-label={t('crt.label')}
      title={t('crt.label')}
      onClick={() => setCrt(!crt)}
      className={cn(
        'border px-2.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        crt
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-ring hover:text-foreground'
      )}
    >
      CRT
    </button>
  )
}
