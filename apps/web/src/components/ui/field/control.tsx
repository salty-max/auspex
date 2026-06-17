import { type ComponentProps, use } from 'react'

import { FieldIdContext } from '@/components/ui/field/context'
import { cn } from '@/lib/utils'

const INPUT =
  'w-full border border-border bg-input/30 px-2.5 py-1.5 font-mono text-base tabular-nums text-foreground caret-primary outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring'

/** Terminal field input, bound to the field's label via shared id. */
export function FieldControl({
  invalid,
  className,
  ...props
}: ComponentProps<'input'> & { invalid?: boolean }) {
  const id = use(FieldIdContext)
  return (
    <input
      id={id}
      aria-invalid={invalid}
      className={cn(
        INPUT,
        invalid &&
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  )
}
