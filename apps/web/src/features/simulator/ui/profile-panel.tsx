import type { ReactNode } from 'react'

/** A titled group of stat fields — one side of the matchup. */
export function ProfilePanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
        <span className="text-primary">▸ </span>
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </div>
  )
}
