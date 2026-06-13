import { and, eq, sql } from 'drizzle-orm'

import type { ListsDatabase } from '../db/client'
import { lists } from '../db/schema'

/** A stored army list. */
export interface ArmyListRecord {
  id: string
  owner: string
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

/** Persistence for army lists, scoped to their owning user. */
export interface ListRepository {
  create(owner: string, input: CreateListInput): Promise<ArmyListRecord>
  list(owner: string): Promise<ArmyListRecord[]>
  get(owner: string, id: string): Promise<ArmyListRecord | undefined>
  update(
    owner: string,
    id: string,
    patch: UpdateListInput
  ): Promise<ArmyListRecord | undefined>
  remove(owner: string, id: string): Promise<boolean>
}

/** A Postgres-backed list repository. */
export function drizzleListRepository(db: ListsDatabase): ListRepository {
  const owned = (owner: string, id: string) =>
    and(eq(lists.owner, owner), eq(lists.id, id))

  return {
    async create(owner, input) {
      const [row] = await db
        .insert(lists)
        .values({ ...input, owner })
        .returning()
      return row
    },
    async list(owner) {
      return db
        .select()
        .from(lists)
        .where(eq(lists.owner, owner))
        .orderBy(lists.createdAt)
    },
    async get(owner, id) {
      const [row] = await db.select().from(lists).where(owned(owner, id))
      return row
    },
    async update(owner, id, patch) {
      // `updatedAt` comes from the database clock, like `createdAt` did on insert
      // — a JS Date can be milliseconds behind Postgres and look older.
      const [row] = await db
        .update(lists)
        .set({ ...patch, updatedAt: sql`now()` })
        .where(owned(owner, id))
        .returning()
      return row
    },
    async remove(owner, id) {
      const removed = await db
        .delete(lists)
        .where(owned(owner, id))
        .returning({ id: lists.id })
      return removed.length > 0
    },
  }
}

/** An in-memory list repository, for testing the routes without Postgres. */
export function inMemoryListRepository(): ListRepository {
  const store = new Map<string, ArmyListRecord>()
  const ownedBy = (record: ArmyListRecord, owner: string) =>
    record.owner === owner

  return {
    create(owner, input) {
      const now = new Date()
      const record: ArmyListRecord = {
        id: crypto.randomUUID(),
        owner,
        ...input,
        createdAt: now,
        updatedAt: now,
      }
      store.set(record.id, record)
      return Promise.resolve(record)
    },
    list(owner) {
      return Promise.resolve(
        [...store.values()]
          .filter((record) => ownedBy(record, owner))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      )
    },
    get(owner, id) {
      const record = store.get(id)
      return Promise.resolve(
        record && ownedBy(record, owner) ? record : undefined
      )
    },
    update(owner, id, patch) {
      const existing = store.get(id)
      if (!existing || !ownedBy(existing, owner))
        return Promise.resolve(undefined)
      const updated: ArmyListRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date(),
      }
      store.set(id, updated)
      return Promise.resolve(updated)
    },
    remove(owner, id) {
      const existing = store.get(id)
      if (!existing || !ownedBy(existing, owner)) return Promise.resolve(false)
      store.delete(id)
      return Promise.resolve(true)
    },
  }
}
