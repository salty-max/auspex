import { Toggle as TogglePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Terminal-styled two-state toggle (lit when on). */
export function Toggle({
  className,
  ...props
}: ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      className={cn(
        'border border-border px-2.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:border-ring hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        className
      )}
      {...props}
    />
  )
}
