import { type ComponentProps, useId } from 'react'

import { cn } from '@/lib/utils'

const INPUT =
  'w-full border border-border bg-input/30 px-2.5 py-1.5 font-mono text-base tabular-nums text-foreground caret-primary outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring'

/** A labelled terminal field; forwards native input props. */
export function Field({
  label,
  invalid,
  className,
  ...props
}: ComponentProps<'input'> & { label: string; invalid?: boolean }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
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
    </div>
  )
}
