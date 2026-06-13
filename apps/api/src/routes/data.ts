import {
  findDatasheets,
  getDatasheet,
  listFactions,
  listKeywords,
} from '@auspex/data'
import { zValidator } from '@hono/zod-validator'
import type { Database } from 'bun:sqlite'
import { Hono } from 'hono'
import { z } from 'zod'

import { badRequest, notFound } from '../errors'

/** Query parameters for the datasheet filter, parsed from the request string. */
const filterQuery = z.object({
  keywords: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
        : undefined
    ),
  maxPoints: z.coerce.number().int().positive().optional(),
})

/** The read-only data routes, serving the baked artifact through `@auspex/data`. */
export function dataRoutes(db: Database): Hono {
  return new Hono()
    .get('/factions', (c) => c.json({ factions: listFactions(db) }))
    .get(
      '/factions/:faction/datasheets',
      zValidator('query', filterQuery, (result) => {
        if (!result.success) {
          throw badRequest('Invalid query parameters.')
        }
      }),
      (c) => {
        const faction = c.req.param('faction')
        const { keywords, maxPoints } = c.req.valid('query')
        return c.json({
          datasheets: findDatasheets(db, {
            faction,
            ...(keywords && { keywords }),
            ...(maxPoints !== undefined && { maxPoints }),
          }),
        })
      }
    )
    .get('/factions/:faction/datasheets/:id', (c) => {
      const faction = c.req.param('faction')
      const id = c.req.param('id')
      const datasheet = getDatasheet(db, faction, id)
      if (!datasheet) {
        throw notFound(`No datasheet "${id}" in ${faction}.`)
      }
      return c.json({ datasheet })
    })
    .get('/keywords', (c) => {
      const faction = c.req.query('faction')
      return c.json({
        keywords: listKeywords(db, faction === undefined ? undefined : faction),
      })
    })
}
