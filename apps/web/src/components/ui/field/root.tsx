import { type ReactNode, useId } from 'react'

import { FieldIdContext } from '@/components/ui/field/context'
import { cn } from '@/lib/utils'

/** Groups a `Field.Label` and `Field.Control`, sharing one generated id. */
export function FieldRoot({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <FieldIdContext value={id}>
      <div className={cn('space-y-1.5', className)}>{children}</div>
    </FieldIdContext>
  )
}
