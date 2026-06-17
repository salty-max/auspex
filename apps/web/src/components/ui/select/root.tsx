import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

/** Root of the terminal Select (wraps Radix Select.Root). */
export function SelectRoot(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />
}
