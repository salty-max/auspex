import type { ReactNode } from 'react'

import { Box } from '@/components/ui/box'

/** A classification-tag section label: a short rule plus uppercase mono text. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      as="p"
      direction="row"
      align="center"
      gap={2.5}
      className="font-mono text-xs uppercase tracking-[0.3em] text-primary"
    >
      <span aria-hidden className="h-px w-6 bg-primary/60" />
      {children}
    </Box>
  )
}
