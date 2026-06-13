import { simulate, type Target, type Weapon } from '@auspex/engine'
import { useQuery } from '@tanstack/react-query'
import { Crosshair, Database, Hammer, Sigma } from 'lucide-react'
import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@/lib/api'

// A bolter squad into a Marine: the engine's canonical example, run in-browser.
const bolter: Weapon = { attacks: 10, skill: 3, strength: 4, ap: 0, damage: 1 }
const marine: Target = { toughness: 4, save: 3, wounds: 2, models: 5 }

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-bold tracking-widest text-primary">
            AUSPEX
          </span>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            Combat Auguries
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
      <Badge className="mb-6 uppercase tracking-widest">
        <Sigma className="size-3" />
        Exact, not Monte Carlo
      </Badge>
      <h1 className="font-display text-5xl font-black tracking-wide sm:text-6xl">
        Know the odds
        <span className="block text-primary">before the dice fall.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Auspex computes the exact probability of any Warhammer&nbsp;40,000
        combat — every hit, wound, save and point of damage — instantly, in your
        browser. Build a list, point it at a target, read the future.
      </p>
    </section>
  )
}

function EngineSection() {
  const result = simulate(bolter, marine)
  const peak = Math.max(...result.damageDistribution)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="size-5 text-primary" />
          Live, in your browser
        </CardTitle>
        <CardDescription>
          Ten bolter shots into a five-model Marine squad — the full damage
          distribution, computed exactly on this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-8">
          <Stat label="Mean damage" value={result.mean.toFixed(2)} />
          <Stat
            label="Models slain"
            value={result.meanModelsSlain.toFixed(2)}
          />
          <Stat
            label="At least one kill"
            value={`${(result.probKillsAtLeast(1) * 100).toFixed(0)}%`}
          />
        </div>
        <div className="flex h-28 items-end gap-1.5">
          {result.damageDistribution.map((p, damage) => (
            <div
              key={damage}
              className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
              style={{ height: `${Math.max(2, (p / peak) * 100)}%` }}
              title={`${damage} damage: ${(p * 100).toFixed(1)}%`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Damage dealt, 0 → {result.damageDistribution.length - 1}
        </p>
      </CardContent>
    </Card>
  )
}

function Features() {
  const { data } = useQuery({
    queryKey: ['factions'],
    queryFn: async () => {
      const res = await api.factions.$get()
      if (!res.ok) throw new Error('request failed')
      return res.json()
    },
    retry: false,
  })

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Feature
        icon={<Sigma className="size-5 text-primary" />}
        title="Exact engine"
        body="Closed-form probability for the whole 10th-edition attack sequence — keywords, re-rolls, overkill. No sampling, no error bars."
      />
      <Feature
        icon={<Database className="size-5 text-primary" />}
        title="Every faction"
        body={
          data
            ? `${data.factions.length} factions imported from community data, validated and costed.`
            : 'Every faction imported from community data, validated and costed.'
        }
      />
      <Feature
        icon={<Hammer className="size-5 text-primary" />}
        title="Army builder"
        body="Filter, pick and price units; write lists as terse text. Resolved and simulated end to end. (Coming next.)"
      />
    </div>
  )
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-xs text-muted-foreground">
      Auspex is an unofficial fan tool. Warhammer 40,000 is a trademark of Games
      Workshop. Not affiliated with or endorsed by Games Workshop.
    </footer>
  )
}

export function App() {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl space-y-12 px-6 pb-16">
        <Hero />
        <EngineSection />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
