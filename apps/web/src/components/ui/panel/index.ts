import { PanelBody } from '@/components/ui/panel/body'
import { PanelHeader } from '@/components/ui/panel/header'
import { PanelRoot } from '@/components/ui/panel/root'

/** Cogitator panel compound: `Panel`, `Panel.Header`, `Panel.Body`. */
export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Body: PanelBody,
})
