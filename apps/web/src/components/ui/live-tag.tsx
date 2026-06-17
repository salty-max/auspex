import type { ReactNode } from 'react'

/** A pulsing "live" indicator with a label, for panel headers. */
export function LiveTag({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
      <span
        aria-hidden
        className="size-1.5 animate-pulse rounded-full bg-primary"
      />
      {children}
    </span>
  )
}
