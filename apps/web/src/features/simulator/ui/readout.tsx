import type { SimResult } from '@auspex/engine'
import { Trans, useTranslation } from 'react-i18next'

import { Stat } from '@/components/ui/stat'
import { percent } from '@/features/simulator/domain/matchup'
import { DistributionChart } from '@/features/simulator/ui/distribution-chart'

/** The threat assessment: summary figures, the distribution, and the takeaway. */
export function Readout({ result }: { result: SimResult }) {
  const { t } = useTranslation('simulator')
  const beatsAverage = result.probAtLeast(Math.round(result.mean))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t('readout.meanDamage')} value={result.mean.toFixed(2)} />
        <Stat
          label={t('readout.modelsSlain')}
          value={result.meanModelsSlain.toFixed(2)}
        />
        <Stat
          label={t('readout.atLeastOneKill')}
          value={percent(result.probKillsAtLeast(1))}
        />
        <Stat
          label={t('readout.unitWiped')}
          value={percent(result.probWipes)}
        />
      </div>

      <DistributionChart result={result} />

      <p className="text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="readout.takeaway"
          values={{ mean: result.mean.toFixed(1), pct: percent(beatsAverage) }}
          components={{
            m: <span className="font-mono text-foreground" />,
            p: <span className="font-mono text-foreground" />,
          }}
        />
      </p>
    </div>
  )
}
