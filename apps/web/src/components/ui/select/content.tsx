import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Portalled, terminal-styled select dropdown, width-matched to the trigger. */
export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          'z-50 min-w-[var(--radix-select-trigger-width)] border border-border bg-card font-mono text-xs uppercase tracking-wider text-foreground shadow-lg',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-0.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
