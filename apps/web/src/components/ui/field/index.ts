import { FieldControl } from '@/components/ui/field/control'
import { FieldLabel } from '@/components/ui/field/label'
import { FieldRoot } from '@/components/ui/field/root'

/** Field compound: `Field`, `Field.Label`, `Field.Control`. */
export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Control: FieldControl,
})
