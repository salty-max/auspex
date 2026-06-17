import { CallToAction } from '@/features/landing/ui/call-to-action'
import { Features } from '@/features/landing/ui/features'
import { Hero } from '@/features/landing/ui/hero'

/** The Auspex marketing landing. */
export function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      <Hero />
      <Features />
      <CallToAction />
    </main>
  )
}
