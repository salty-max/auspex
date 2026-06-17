import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { LanguageToggle } from '@/features/localization/ui/language-toggle'
import { CrtToggle } from '@/theme/crt-toggle'
import { ThemeControls } from '@/theme/theme-controls'

/** The palette / CRT / language controls, laid out by the passed className. */
function HeaderControls({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ThemeControls />
      <CrtToggle />
      <LanguageToggle />
    </div>
  )
}

/** App-wide top bar: wordmark (links home), descriptor, and the controls. */
export function SiteHeader() {
  const { t } = useTranslation('common')
  return (
    <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-xl font-bold tracking-[0.18em] text-primary text-glow">
            AUSPEX
          </span>
          <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            {t('tagline')}
          </span>
        </Link>

        <HeaderControls className="hidden items-center gap-2 sm:flex" />

        <div className="sm:hidden">
          <Popover>
            <Popover.Trigger asChild>
              <Button variant="ghost" aria-label={t('nav.menu')}>
                <Menu className="size-5" />
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <HeaderControls className="flex flex-col items-stretch gap-3" />
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </header>
  )
}
