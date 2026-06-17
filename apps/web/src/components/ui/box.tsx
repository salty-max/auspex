import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from '@/lib/utils'

type Direction = 'row' | 'col'
type Step = 0 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8
type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between'

// Literal class maps so Tailwind's JIT generates them (no dynamic `gap-${n}`).
const DIRECTION: Record<Direction, string> = {
  row: 'flex-row',
  col: 'flex-col',
}
const GAP: Record<Step, string> = {
  0: 'gap-0',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
}
const PAD: Record<Step, string> = {
  0: 'p-0',
  1: 'p-1',
  1.5: 'p-1.5',
  2: 'p-2',
  3: 'p-3',
  4: 'p-4',
  5: 'p-5',
  6: 'p-6',
  8: 'p-8',
}
const ALIGN: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}
const JUSTIFY: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

interface BoxProps {
  /** Element to render. Defaults to `div`. */
  as?: ElementType
  direction?: Direction
  gap?: Step
  p?: Step
  align?: Align
  justify?: Justify
  wrap?: boolean
}

/** Flex layout primitive mapping direction/gap/align/justify/padding to the spacing scale. */
export function Box({
  as: Comp = 'div',
  direction = 'col',
  gap,
  p,
  align,
  justify,
  wrap,
  className,
  ...props
}: BoxProps & ComponentPropsWithoutRef<'div'>) {
  return (
    <Comp
      className={cn(
        'flex',
        DIRECTION[direction],
        gap !== undefined && GAP[gap],
        p !== undefined && PAD[p],
        align && ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  )
}
