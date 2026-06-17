import { useMemo, useState } from 'react'

import {
  DEFAULT_TARGET,
  DEFAULT_WEAPON,
  runSimulation,
  type TargetForm,
  type WeaponForm,
} from '@/features/simulator/domain/matchup'

/** Owns the editable matchup and recomputes the exact result on every change. */
export function useSimulation() {
  const [weapon, setWeapon] = useState<WeaponForm>(DEFAULT_WEAPON)
  const [target, setTarget] = useState<TargetForm>(DEFAULT_TARGET)
  const sim = useMemo(() => runSimulation(weapon, target), [weapon, target])

  return { weapon, setWeapon, target, setTarget, sim }
}
