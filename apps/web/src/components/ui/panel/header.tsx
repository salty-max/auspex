import type { ReactNode } from 'react'

import { Box } from '@/components/ui/box'
import { cn } from '@/lib/utils'

/** A command-prompt header bar for a Panel; `right` is an optional trailing slot. */
export function PanelHeader({
  children,
  right,
  className,
}: {
  children: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <Box
      direction="row"
      align="center"
      justify="between"
      gap={3}
      className={cn(
        'border-b border-border bg-muted/30 px-5 py-2.5',
        className
      )}
    >
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary text-glow">
        {'> '}
        {children}
      </span>
      {right}
    </Box>
  )
}
