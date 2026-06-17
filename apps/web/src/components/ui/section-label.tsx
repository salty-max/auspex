import type { ReactNode } from 'react'

/** A classification-tag section label: a short rule plus uppercase mono text. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.3em] text-primary">
      <span aria-hidden className="h-px w-6 bg-primary/60" />
      {children}
    </p>
  )
}
