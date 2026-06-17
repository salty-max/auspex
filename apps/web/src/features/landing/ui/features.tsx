import { useTranslation } from 'react-i18next'

import { SectionLabel } from '@/components/ui/section-label'
import { useFactions } from '@/features/factions/hooks/use-factions'

/** The capabilities dossier — what Auspex offers, with a live faction count. */
export function Features() {
  const { t } = useTranslation('landing')
  const { data } = useFactions()
  const count = data ? data.factions.length : 36

  const items = [
    {
      n: 'I',
      title: t('features.exact.title'),
      body: t('features.exact.body'),
    },
    {
      n: 'II',
      title: t('features.factions.title', { count }),
      body: t('features.factions.body'),
    },
    {
      n: 'III',
      title: t('features.builder.title'),
      body: t('features.builder.body'),
    },
    {
      n: 'IV',
      title: t('features.save.title'),
      body: t('features.save.body'),
    },
  ]

  return (
    <section className="border-t border-border/60 py-16">
      <SectionLabel>{t('features.label')}</SectionLabel>
      <h2 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-glow sm:text-4xl">
        {t('features.heading')}
      </h2>
      <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {items.map(({ n, title, body }) => (
          <div key={n} className="flex gap-5 border-t border-border/60 pt-5">
            <span className="w-12 shrink-0 font-display text-2xl font-bold text-primary/70 text-glow">
              {n}
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
