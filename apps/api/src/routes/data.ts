import {
  findDatasheets,
  getDatasheet,
  listFactions,
  listKeywords,
} from '@auspex/data'
import { datasheetSchema } from '@auspex/schema'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Database } from 'bun:sqlite'

import { badRequest, notFound } from '../errors'

/** The error body every failed request returns. */
const ErrorSchema = z
  .object({
    error: z.object({ code: z.string(), message: z.string() }),
  })
  .openapi('Error')

/** A datasheet summary as returned by the picker. */
const DatasheetSummarySchema = z
  .object({
    faction: z.string(),
    id: z.string(),
    name: z.string(),
    points: z.number().int(),
  })
  .openapi('DatasheetSummary')

const jsonError = (description: string) => ({
  content: { 'application/json': { schema: ErrorSchema } },
  description,
})

const factionsRoute = createRoute({
  method: 'get',
  path: '/factions',
  summary: 'List every faction in the artifact',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ factions: z.array(z.string()) }),
        },
      },
      description: 'The faction names, alphabetical.',
    },
  },
})

const datasheetsRoute = createRoute({
  method: 'get',
  path: '/factions/{faction}/datasheets',
  summary: 'Filter a faction’s datasheets',
  request: {
    params: z.object({ faction: z.string() }),
    query: z.object({
      keywords: z.string().optional().openapi({
        description: 'Comma-separated keywords; all must match (AND).',
        example: 'CHARACTER,EPIC HERO',
      }),
      maxPoints: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .openapi({ description: 'Cap on base-size points.', example: 100 }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ datasheets: z.array(DatasheetSummarySchema) }),
        },
      },
      description: 'The matching datasheet summaries, name-ordered.',
    },
    400: jsonError('Malformed query parameters.'),
  },
})

const datasheetRoute = createRoute({
  method: 'get',
  path: '/factions/{faction}/datasheets/{id}',
  summary: 'Get one datasheet',
  request: {
    params: z.object({ faction: z.string(), id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ datasheet: datasheetSchema }),
        },
      },
      description: 'The full datasheet.',
    },
    404: jsonError('No such datasheet.'),
  },
})

const keywordsRoute = createRoute({
  method: 'get',
  path: '/keywords',
  summary: 'List distinct keywords, optionally scoped to a faction',
  request: {
    query: z.object({ faction: z.string().optional() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ keywords: z.array(z.string()) }),
        },
      },
      description: 'The distinct keywords, alphabetical.',
    },
  },
})

/** The read-only data routes, serving the baked artifact through `@auspex/data`. */
export function dataRoutes(db: Database): OpenAPIHono {
  const app = new OpenAPIHono({
    defaultHook: (result) => {
      if (!result.success) {
        throw badRequest('Invalid query parameters.')
      }
    },
  })

  app.openapi(factionsRoute, (c) => c.json({ factions: listFactions(db) }, 200))

  app.openapi(datasheetsRoute, (c) => {
    const { faction } = c.req.valid('param')
    const keywordsParam = c.req.valid('query').keywords
    const keywords = keywordsParam
      ? keywordsParam
          .split(',')
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0)
      : undefined
    const { maxPoints } = c.req.valid('query')
    return c.json(
      {
        datasheets: findDatasheets(db, {
          faction,
          ...(keywords && { keywords }),
          ...(maxPoints !== undefined && { maxPoints }),
        }),
      },
      200
    )
  })

  app.openapi(datasheetRoute, (c) => {
    const { faction, id } = c.req.valid('param')
    const datasheet = getDatasheet(db, faction, id)
    if (!datasheet) {
      throw notFound(`No datasheet "${id}" in ${faction}.`)
    }
    return c.json({ datasheet }, 200)
  })

  app.openapi(keywordsRoute, (c) => {
    const { faction } = c.req.valid('query')
    return c.json({ keywords: listKeywords(db, faction) }, 200)
  })

  return app
}
