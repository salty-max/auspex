import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Wraps content in HUD-style targeting brackets at each corner. */
export function CornerFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const corner = 'pointer-events-none absolute size-3 border-primary/70'
  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className={cn(corner, 'top-0 left-0 border-t border-l')}
      />
      <span
        aria-hidden
        className={cn(corner, 'top-0 right-0 border-t border-r')}
      />
      <span
        aria-hidden
        className={cn(corner, 'bottom-0 left-0 border-b border-l')}
      />
      <span
        aria-hidden
        className={cn(corner, 'right-0 bottom-0 border-r border-b')}
      />
      {children}
    </div>
  )
}
