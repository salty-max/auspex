import { useTranslation } from 'react-i18next'

import { LiveTag } from '@/components/ui/live-tag'
import { Panel } from '@/components/ui/panel'
import { useSimulation } from '@/features/simulator/hooks/use-simulation'
import { DiceField } from '@/features/simulator/ui/dice-field'
import { NumberField } from '@/features/simulator/ui/number-field'
import { ProfilePanel } from '@/features/simulator/ui/profile-panel'
import { Readout } from '@/features/simulator/ui/readout'

/** The interactive combat console: an editable matchup with a live readout. */
export function Console() {
  const { t } = useTranslation('simulator')
  const { weapon, setWeapon, target, setTarget, sim } = useSimulation()

  return (
    <Panel>
      <Panel.Header right={<LiveTag>{t('console.live')}</LiveTag>}>
        {t('console.heading')}
      </Panel.Header>

      <Panel.Body className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <ProfilePanel title={t('console.attacker')}>
          <DiceField
            label={t('console.fields.attacks')}
            value={weapon.attacks}
            onChange={(attacks) => setWeapon((w) => ({ ...w, attacks }))}
          />
          <NumberField
            label={t('console.fields.skill')}
            value={weapon.skill}
            min={2}
            max={6}
            onChange={(skill) => setWeapon((w) => ({ ...w, skill }))}
          />
          <DiceField
            label={t('console.fields.strength')}
            value={weapon.strength}
            onChange={(strength) => setWeapon((w) => ({ ...w, strength }))}
          />
          <NumberField
            label={t('console.fields.ap')}
            value={weapon.ap}
            min={0}
            max={6}
            onChange={(ap) => setWeapon((w) => ({ ...w, ap }))}
          />
          <DiceField
            label={t('console.fields.damage')}
            value={weapon.damage}
            onChange={(damage) => setWeapon((w) => ({ ...w, damage }))}
          />
        </ProfilePanel>

        <ProfilePanel title={t('console.target')}>
          <NumberField
            label={t('console.fields.toughness')}
            value={target.toughness}
            min={1}
            max={14}
            onChange={(toughness) => setTarget((tt) => ({ ...tt, toughness }))}
          />
          <NumberField
            label={t('console.fields.save')}
            value={target.save}
            min={2}
            max={7}
            onChange={(save) => setTarget((tt) => ({ ...tt, save }))}
          />
          <NumberField
            label={t('console.fields.wounds')}
            value={target.wounds}
            min={1}
            max={40}
            onChange={(wounds) => setTarget((tt) => ({ ...tt, wounds }))}
          />
          <NumberField
            label={t('console.fields.models')}
            value={target.models}
            min={1}
            max={40}
            onChange={(models) => setTarget((tt) => ({ ...tt, models }))}
          />
        </ProfilePanel>
      </Panel.Body>

      <div className="border-t border-border bg-muted/20 p-5 sm:p-6">
        {sim.ok ? (
          <Readout result={sim.result} />
        ) : (
          <p className="font-mono text-sm text-destructive">{sim.error}</p>
        )}
      </div>
    </Panel>
  )
}
