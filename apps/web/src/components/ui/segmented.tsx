import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/** An animated segmented control with a sliding active indicator. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  )
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative inline-flex border border-border p-0.5"
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 bg-primary transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 min-w-9 px-2.5 py-1 text-center text-xs font-medium uppercase tracking-wider transition-colors',
            value === option.value
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
