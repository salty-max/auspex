import { Console } from '@/features/simulator/ui/console'

/** The /simulator screen: the interactive combat console. */
export function SimulatorPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Console />
    </main>
  )
}
