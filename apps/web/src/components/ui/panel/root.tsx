import type { ReactNode } from 'react'

import { CornerFrame } from '@/components/corner-frame'
import { cn } from '@/lib/utils'

/** A bordered cogitator panel with HUD corner brackets. */
export function PanelRoot({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <CornerFrame
      className={cn('border border-border bg-card/50 backdrop-blur', className)}
    >
      {children}
    </CornerFrame>
  )
}
