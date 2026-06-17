import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { lazy } from 'react'

import { RootLayout } from '@/app/root-layout'
import { LandingPage } from '@/features/landing/ui/landing-page'

// Code-split the simulator (and the engine it pulls in) off the landing bundle.
const SimulatorPage = lazy(() =>
  import('@/features/simulator/ui/simulator-page').then((m) => ({
    default: m.SimulatorPage,
  }))
)

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simulator',
  component: SimulatorPage,
})

const routeTree = rootRoute.addChildren([indexRoute, simulatorRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
