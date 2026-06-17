import { useTranslation } from 'react-i18next'

import { SectionLabel } from '@/components/ui/section-label'
import { CtaLink } from '@/features/landing/ui/cta-link'
import { HeroPreview } from '@/features/landing/ui/hero-preview'

/** The conversion hero, framed as an augur terminal. */
export function Hero() {
  const { t } = useTranslation('landing')

  return (
    <section className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
      <div>
        <SectionLabel>{t('hero.eyebrow')}</SectionLabel>
        <h1 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-balance text-glow sm:text-5xl lg:text-6xl">
          {t('hero.title')}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
          {t('hero.subtitle')}
        </p>
        <div className="mt-8">
          <CtaLink>{t('hero.cta')}</CtaLink>
        </div>
      </div>
      <HeroPreview />
    </section>
  )
}
