import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
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

/** Mobile disclosure holding the header controls, closes on outside click / Escape. */
function HeaderMenu() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        aria-label={open ? t('nav.close') : t('nav.menu')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 border border-border bg-card p-4 shadow-lg">
          <HeaderControls className="flex flex-col items-stretch gap-3" />
        </div>
      )}
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
          <HeaderMenu />
        </div>
      </div>
    </header>
  )
}
