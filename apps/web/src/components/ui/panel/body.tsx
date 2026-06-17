import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Padded body region of a Panel. */
export function PanelBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>
}
