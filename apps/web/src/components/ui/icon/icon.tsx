import { useEffect, useState } from 'react'

import ArmourPenetrationGlyph from '@/assets/icons/general/armour-penetration.svg?react'
import AttacksGlyph from '@/assets/icons/general/attacks.svg?react'
import BallisticSkillGlyph from '@/assets/icons/general/ballistic-skill.svg?react'
import DamageGlyph from '@/assets/icons/general/damage.svg?react'
import LeadershipGlyph from '@/assets/icons/general/leadership.svg?react'
import MeleeGlyph from '@/assets/icons/general/melee.svg?react'
import MoveGlyph from '@/assets/icons/general/move.svg?react'
import RangeGlyph from '@/assets/icons/general/range.svg?react'
import SaveGlyph from '@/assets/icons/general/save.svg?react'
import StrengthGlyph from '@/assets/icons/general/strength.svg?react'
import ToughnessGlyph from '@/assets/icons/general/toughness.svg?react'
import ModelsGlyph from '@/assets/icons/general/user.svg?react'
import WeaponSkillGlyph from '@/assets/icons/general/weapon-skill.svg?react'
import WoundsGlyph from '@/assets/icons/general/wounds.svg?react'
import type { IconName } from '@/components/ui/icon/registry.gen'
import { cn } from '@/lib/utils'

/** An inline SVG component produced by vite-plugin-svgr. */
type IconGlyph = React.FunctionComponent<React.SVGProps<SVGSVGElement>>

// The profile-stat glyphs are the hot path (the simulator's stat line), so they
// are bundled eagerly and render synchronously — no flash. They are tiny once
// normalized. Everything else (the ~400 faction and sub-faction crests, 460KB
// gzipped) is code-split into per-icon chunks and fetched only when rendered.
const EAGER_GLYPHS: Partial<Record<IconName, IconGlyph>> = {
  'general/attacks': AttacksGlyph,
  'general/ballistic-skill': BallisticSkillGlyph,
  'general/weapon-skill': WeaponSkillGlyph,
  'general/strength': StrengthGlyph,
  'general/armour-penetration': ArmourPenetrationGlyph,
  'general/damage': DamageGlyph,
  'general/toughness': ToughnessGlyph,
  'general/save': SaveGlyph,
  'general/wounds': WoundsGlyph,
  'general/leadership': LeadershipGlyph,
  'general/move': MoveGlyph,
  'general/range': RangeGlyph,
  'general/melee': MeleeGlyph,
  'general/user': ModelsGlyph,
}

const LAZY_GLYPHS = import.meta.glob('/src/assets/icons/**/*.svg', {
  query: '?react',
  import: 'default',
}) as Record<string, () => Promise<IconGlyph>>

/** Resolved lazy glyphs, so each crest is fetched at most once per session. */
const lazyCache = new Map<IconName, IconGlyph>()

/** Resolve a name to its glyph — synchronous for stats, lazy otherwise. */
function useGlyph(name: IconName): IconGlyph | null {
  const eager = EAGER_GLYPHS[name]
  const [glyph, setGlyph] = useState<IconGlyph | null>(
    () => eager ?? lazyCache.get(name) ?? null
  )

  useEffect(() => {
    const cached = eager ?? lazyCache.get(name)
    if (cached) {
      setGlyph(() => cached)
      return
    }
    let active = true
    LAZY_GLYPHS[`/src/assets/icons/${name}.svg`]?.().then(
      (loaded) => {
        lazyCache.set(name, loaded)
        if (active) setGlyph(() => loaded)
      },
      () => {}
    )
    return () => {
      active = false
    }
  }, [name, eager])

  return glyph
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Which icon to render, as `category/slug` (see `IconName`). */
  name: IconName
  /** Accessible label; when omitted the icon is hidden from assistive tech. */
  title?: string
}

/**
 * Renders a 40k glyph from the cleaned set. Sized to `1em` so it follows the
 * surrounding text, and filled with `currentColor` so it recolours with the
 * active palette. Pass a Tailwind size (e.g. `size-4`) to override, and a
 * `title` to expose it to assistive tech. Lazy crests reserve their box on the
 * first frame and fill in once the chunk loads.
 */
export function Icon({ name, title, className, ...props }: IconProps) {
  const Glyph = useGlyph(name)
  const shared = cn('inline-block size-[1em] shrink-0 fill-current', className)
  if (!Glyph)
    return <svg className={shared} aria-hidden focusable="false" {...props} />
  return (
    <Glyph
      className={shared}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    />
  )
}
