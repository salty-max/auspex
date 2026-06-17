import { Popover as PopoverPrimitive } from 'radix-ui'

import { PopoverContent } from '@/components/ui/popover/content'
import { PopoverRoot } from '@/components/ui/popover/root'

/** Terminal Popover compound: `Popover`, `Popover.Trigger`, `Popover.Content`. */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverPrimitive.Trigger,
  Content: PopoverContent,
})
