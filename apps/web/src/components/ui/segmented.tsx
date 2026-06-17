import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/** A single-select toggle group (Radix) with a sliding active indicator. */
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
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T)
      }}
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
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="relative z-10 min-w-9 px-2.5 py-1 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[state=on]:text-primary-foreground"
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
