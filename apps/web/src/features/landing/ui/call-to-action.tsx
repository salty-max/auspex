import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import { CtaLink } from '@/features/landing/ui/cta-link'

/** Closing call-to-action panel, framed as an augur directive. */
export function CallToAction() {
  const { t } = useTranslation('landing')
  return (
    <Panel className="my-16">
      <div className="px-6 py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          {t('cta.label')}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-balance text-glow sm:text-4xl">
          {t('cta.title')}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-pretty">
          {t('cta.body')}
        </p>
        <div className="mt-7 flex justify-center">
          <CtaLink>{t('cta.button')}</CtaLink>
        </div>
      </div>
    </Panel>
  )
}
