import { useTranslation } from 'react-i18next'

import { Box } from '@/components/ui/box'
import { LiveTag } from '@/components/ui/live-tag'
import { Panel } from '@/components/ui/panel'
import { Stat } from '@/components/ui/stat'

// Hand-picked heights tracing a representative damage curve — decorative only.
const BARS = [8, 22, 40, 64, 92, 100, 84, 58, 34, 18, 9, 4]

/** A static, decorative teaser of the simulator readout for the hero. */
export function HeroPreview() {
  const { t } = useTranslation('simulator')
  return (
    <div aria-hidden>
      <Panel>
        <Panel.Header right={<LiveTag>{t('console.live')}</LiveTag>}>
          {t('console.heading')}
        </Panel.Header>
        <Panel.Body className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Stat value="7.4" label={t('readout.meanDamage')} />
            <Stat value="2.1" label={t('readout.modelsSlain')} />
            <Stat value="88%" label={t('readout.atLeastOneKill')} />
          </div>
          <Box direction="row" align="end" gap={1.5} className="h-28">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary/25 to-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </Box>
        </Panel.Body>
      </Panel>
    </div>
  )
}
