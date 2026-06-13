import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { user } from '../auth/schema'

/** Army lists, stored as their DSL source and re-resolved on read. */
export const lists = pgTable('lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** The owning user; a list is only visible to its owner. */
  owner: text('owner')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  faction: text('faction').notNull(),
  /** The army list DSL source — the source of truth. */
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
