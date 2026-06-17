import { Field } from '@/components/ui/field'
import { isInvalidDice } from '@/features/simulator/domain/matchup'

/** A text field accepting a dice expression (a number, or e.g. `2D6`, `D3+1`). */
export function DiceField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <Field.Label>{label}</Field.Label>
      <Field.Control
        type="text"
        inputMode="text"
        value={value}
        invalid={isInvalidDice(value)}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </Field>
  )
}
