import { Label as LabelPrimitive } from 'radix-ui'
import { type ReactNode, use } from 'react'

import { FieldIdContext } from '@/components/ui/field/context'

/** Terminal field label (Radix Label), bound to the field's control. */
export function FieldLabel({ children }: { children: ReactNode }) {
  const id = use(FieldIdContext)
  return (
    <LabelPrimitive.Root
      htmlFor={id}
      className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </LabelPrimitive.Root>
  )
}
