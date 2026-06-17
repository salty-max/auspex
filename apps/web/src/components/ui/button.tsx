import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type ButtonVariant = 'solid' | 'outline' | 'ghost'

const BASE =
  'inline-flex items-center justify-center gap-2.5 font-mono text-sm font-medium uppercase tracking-widest transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  solid:
    'border border-primary bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90',
  outline:
    'border border-border px-6 py-3 text-foreground hover:border-ring hover:bg-accent/40',
  ghost: 'p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground',
}

/** Class string for a terminal button — for non-button elements (e.g. a router Link). */
export function buttonStyles(
  variant: ButtonVariant = 'solid',
  className?: string
): string {
  return cn(BASE, VARIANTS[variant], className)
}

/** Terminal-styled button. */
export function Button({
  variant = 'solid',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return <button className={buttonStyles(variant, className)} {...props} />
}
