import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Terminal-styled native select with a chevron affordance. */
export function Select({
  className,
  children,
  ...props
}: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'appearance-none border border-border bg-input/40 py-1.5 pr-7 pl-2.5 font-mono text-xs uppercase tracking-wider text-foreground outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
