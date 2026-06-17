import { useTranslation } from 'react-i18next'

/** App-wide footer: repo link and the Games Workshop IP disclaimer. */
export function SiteFooter() {
  const { t } = useTranslation('common')
  return (
    <footer className="mx-auto max-w-5xl space-y-2 px-6 py-10 text-center text-xs text-muted-foreground">
      <p>
        <a
          href="https://github.com/salty-max/auspex"
          target="_blank"
          rel="noreferrer"
          className="font-mono uppercase tracking-wider text-foreground/70 transition-colors hover:text-primary"
        >
          github.com/salty-max/auspex
        </a>
      </p>
      <p>{t('footer.disclaimer')}</p>
    </footer>
  )
}
