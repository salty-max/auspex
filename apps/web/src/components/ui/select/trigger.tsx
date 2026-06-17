import { ChevronDown } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Terminal-styled select trigger; renders the selected value and a chevron. */
export function SelectTrigger({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-between gap-2 border border-border bg-input/40 py-1.5 pr-2 pl-2.5 font-mono text-xs uppercase tracking-wider text-foreground outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Value />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
