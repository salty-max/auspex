import { describe, expect, test } from 'bun:test'
import { hc } from 'hono/client'

import type { AppType } from '../src/app'
import type {
  CreateListBody,
  DatasheetSummary,
  GetListResponse,
} from '../src/contract'

describe('typed contract', () => {
  test('hc<AppType> exposes the endpoints as a typed client', () => {
    const client = hc<AppType>('http://localhost')
    expect(typeof client.factions.$get).toBe('function')
    expect(typeof client.keywords.$get).toBe('function')
    expect(typeof client.lists.$post).toBe('function')
    expect(typeof client.lists.$get).toBe('function')
    expect(typeof client.lists[':id'].$get).toBe('function')
    expect(typeof client.lists[':id'].$patch).toBe('function')
    expect(typeof client.lists[':id'].$delete).toBe('function')
  })

  test('the wire DTO types are importable and well-shaped', () => {
    // These only compile if the contract types match — the web imports them the
    // same way.
    const body: CreateListBody = {
      name: 'X',
      faction: 'Orks',
      body: 'list "X"',
    }
    expect(body.faction).toBe('Orks')

    const summary: DatasheetSummary = {
      faction: 'Orks',
      id: 'boyz',
      name: 'Boyz',
      points: 80,
    }
    expect(summary.points).toBe(80)

    const resolved: GetListResponse = {
      list: {
        id: '1',
        name: 'X',
        faction: 'Orks',
        body: 'list "X"',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      resolved: { army: null, diagnostics: [] },
    }
    expect(resolved.resolved.army).toBeNull()
  })
})
