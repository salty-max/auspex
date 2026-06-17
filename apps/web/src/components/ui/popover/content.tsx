import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Portalled, terminal-styled popover panel. */
export function PopoverContent({
  className,
  align = 'end',
  sideOffset = 8,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 border border-border bg-card p-4 shadow-lg outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
