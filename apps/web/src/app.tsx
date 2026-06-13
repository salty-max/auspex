import { simulate, type Target, type Weapon } from '@auspex/engine'
import { useQuery } from '@tanstack/react-query'
import { Crosshair, Database } from 'lucide-react'

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

function EngineDemo() {
  const result = simulate(bolter, marine)
  const peak = Math.max(...result.damageDistribution)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="text-muted-foreground" />
          Engine, in your browser
        </CardTitle>
        <CardDescription>
          10 bolter shots into a 5-model Marine squad — exact, no Monte Carlo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6 text-sm">
          <Stat label="Mean damage" value={result.mean.toFixed(2)} />
          <Stat
            label="Models slain"
            value={result.meanModelsSlain.toFixed(2)}
          />
          <Stat
            label="P(≥1 kill)"
            value={`${(result.probKillsAtLeast(1) * 100).toFixed(0)}%`}
          />
        </div>
        <div className="flex items-end gap-1 h-24">
          {result.damageDistribution.map((p, damage) => (
            <div
              key={damage}
              className="flex-1 rounded-t-sm bg-primary/80"
              style={{ height: `${(p / peak) * 100}%` }}
              title={`${damage} damage: ${(p * 100).toFixed(1)}%`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Damage distribution (0 → {result.damageDistribution.length - 1}{' '}
          damage)
        </p>
      </CardContent>
    </Card>
  )
}

function ApiDemo() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['factions'],
    queryFn: async () => {
      const res = await api.factions.$get()
      if (!res.ok) throw new Error('request failed')
      return res.json()
    },
    retry: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="text-muted-foreground" />
          Live data, typed
        </CardTitle>
        <CardDescription>
          Factions fetched from the API via the typed <code>hc</code> client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && (
          <p className="text-sm text-muted-foreground">
            API offline — start it with <code>bun run dev</code> in{' '}
            <code>apps/api</code>.
          </p>
        )}
        {data && (
          <p className="text-sm">
            <span className="font-semibold">{data.factions.length}</span>{' '}
            factions: {data.factions.slice(0, 6).join(', ')}…
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function App() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Auspex</h1>
        <p className="text-muted-foreground">
          Exact Warhammer 40,000 combat math — army builder &amp; simulator.
        </p>
      </header>
      <EngineDemo />
      <ApiDemo />
    </main>
  )
}
