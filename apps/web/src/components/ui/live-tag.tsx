import type { ReactNode } from 'react'

import { Box } from '@/components/ui/box'

/** A pulsing "live" indicator with a label, for panel headers. */
export function LiveTag({ children }: { children: ReactNode }) {
  return (
    <Box
      as="span"
      direction="row"
      align="center"
      gap={1.5}
      className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground"
    >
      <span
        aria-hidden
        className="size-1.5 animate-pulse rounded-full bg-primary"
      />
      {children}
    </Box>
  )
}
