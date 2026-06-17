import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

/** Root of the terminal Popover (wraps Radix Popover.Root). */
export function PopoverRoot(
  props: ComponentProps<typeof PopoverPrimitive.Root>
) {
  return <PopoverPrimitive.Root {...props} />
}
