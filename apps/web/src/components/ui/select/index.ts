import { SelectContent } from '@/components/ui/select/content'
import { SelectItem } from '@/components/ui/select/item'
import { SelectRoot } from '@/components/ui/select/root'
import { SelectTrigger } from '@/components/ui/select/trigger'

/** Terminal Select compound: `Select`, `Select.Trigger`, `Select.Content`, `Select.Item`. */
export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
})
