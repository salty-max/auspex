import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { buttonStyles } from '@/components/ui/button'

/** Militant, terminal-styled call-to-action link into the app. */
export function CtaLink({ children }: { children: ReactNode }) {
  return (
    <Link to="/app" className={buttonStyles('solid', 'group')}>
      <span
        aria-hidden
        className="text-primary-foreground/70 transition-transform group-hover:translate-x-0.5"
      >
        ▸
      </span>
      {children}
    </Link>
  )
}
