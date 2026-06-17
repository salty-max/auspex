import type { SimResult } from '@auspex/engine'
import { useTranslation } from 'react-i18next'

/** The damage distribution as bars, with the mean marked. */
export function DistributionChart({ result }: { result: SimResult }) {
  const { t } = useTranslation('simulator')
  const dist = result.damageDistribution
  const peak = Math.max(...dist)
  const maxDamage = dist.length - 1
  const meanLeft = (((result.mean + 0.5) / dist.length) * 100).toFixed(2)

  return (
    <div className="pt-5">
      <div className="relative flex h-32 items-end gap-px">
        <div
          className="absolute inset-y-0 z-10 w-px bg-foreground/50 transition-[left] duration-300 ease-out"
          style={{ left: `${meanLeft}%` }}
          aria-hidden
        >
          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-wider text-foreground/70">
            {t('chart.mean', { mean: result.mean.toFixed(1) })}
          </span>
        </div>
        {dist.map((p, damage) => (
          <div
            key={damage}
            className="flex-1 bg-gradient-to-t from-primary/25 to-primary transition-[height] duration-300 ease-out"
            style={{ height: `${Math.max(2, (p / peak) * 100)}%` }}
            title={`${damage} damage: ${(p * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        <span>{t('chart.min')}</span>
        <span>{t('chart.max', { max: maxDamage })}</span>
      </div>
    </div>
  )
}
