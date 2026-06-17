import { Outlet } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/** Shared chrome wrapped around every route. */
export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}
