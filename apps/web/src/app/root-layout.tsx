import { Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/** Shown while a lazily-loaded route chunk is fetched. */
function RouteFallback() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
        {'> '}initialising augur…
      </p>
    </main>
  )
}

/** Shared chrome wrapped around every route. */
export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  )
}
