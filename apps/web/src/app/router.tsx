import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

import { RootLayout } from '@/app/root-layout'
import { LandingPage } from '@/features/landing/ui/landing-page'
import { SimulatorPage } from '@/features/simulator/ui/simulator-page'

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: SimulatorPage,
})

const routeTree = rootRoute.addChildren([indexRoute, appRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
