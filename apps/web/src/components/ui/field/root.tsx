import { type ReactNode, useId } from 'react'

import { Box } from '@/components/ui/box'
import { FieldIdContext } from '@/components/ui/field/context'

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
      <Box gap={1.5} className={className}>
        {children}
      </Box>
    </FieldIdContext>
  )
}
