import { eq } from 'drizzle-orm'

import type { ListsDatabase } from '../db/client'
import { lists } from '../db/schema'

/** A stored army list. */
export interface ArmyListRecord {
  id: string
  name: string
  faction: string
  /** The DSL source — the source of truth. */
  body: string
  createdAt: Date
  updatedAt: Date
}

/** The fields needed to create a list. */
export interface CreateListInput {
  name: string
  faction: string
  body: string
}

/** The fields a list update may change. */
export interface UpdateListInput {
  name?: string
  body?: string
}

/** Persistence for army lists. */
export interface ListRepository {
  create(input: CreateListInput): Promise<ArmyListRecord>
  list(): Promise<ArmyListRecord[]>
  get(id: string): Promise<ArmyListRecord | undefined>
  update(
    id: string,
    patch: UpdateListInput
  ): Promise<ArmyListRecord | undefined>
  remove(id: string): Promise<boolean>
}

/** A Postgres-backed list repository. */
export function drizzleListRepository(db: ListsDatabase): ListRepository {
  return {
    async create(input) {
      const [row] = await db.insert(lists).values(input).returning()
      return row
    },
    async list() {
      return db.select().from(lists).orderBy(lists.createdAt)
    },
    async get(id) {
      const [row] = await db.select().from(lists).where(eq(lists.id, id))
      return row
    },
    async update(id, patch) {
      const [row] = await db
        .update(lists)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(lists.id, id))
        .returning()
      return row
    },
    async remove(id) {
      const removed = await db
        .delete(lists)
        .where(eq(lists.id, id))
        .returning({ id: lists.id })
      return removed.length > 0
    },
  }
}

/** An in-memory list repository, for testing the routes without Postgres. */
export function inMemoryListRepository(): ListRepository {
  const store = new Map<string, ArmyListRecord>()
  return {
    create(input) {
      const now = new Date()
      const record: ArmyListRecord = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: now,
        updatedAt: now,
      }
      store.set(record.id, record)
      return Promise.resolve(record)
    },
    list() {
      return Promise.resolve(
        [...store.values()].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )
      )
    },
    get(id) {
      return Promise.resolve(store.get(id))
    },
    update(id, patch) {
      const existing = store.get(id)
      if (!existing) return Promise.resolve(undefined)
      const updated: ArmyListRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date(),
      }
      store.set(id, updated)
      return Promise.resolve(updated)
    },
    remove(id) {
      return Promise.resolve(store.delete(id))
    },
  }
}
