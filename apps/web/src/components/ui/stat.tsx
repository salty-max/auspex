/** A labelled readout figure with phosphor glow. */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold tabular-nums text-glow sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
