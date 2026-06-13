import {
  findDatasheets,
  getDatasheet,
  listFactions,
  listKeywords,
} from '@auspex/data'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Database } from 'bun:sqlite'

import {
  datasheetFilterQuerySchema,
  datasheetResponseSchema,
  datasheetsResponseSchema,
  errorSchema,
  factionsResponseSchema,
  keywordsResponseSchema,
} from '../contract'
import { badRequest, notFound } from '../errors'

const jsonError = (description: string) => ({
  content: { 'application/json': { schema: errorSchema } },
  description,
})

const factionsRoute = createRoute({
  method: 'get',
  path: '/factions',
  summary: 'List every faction in the artifact',
  responses: {
    200: {
      content: { 'application/json': { schema: factionsResponseSchema } },
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
    query: datasheetFilterQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: datasheetsResponseSchema } },
      description: 'The matching datasheet summaries, name-ordered.',
    },
    400: jsonError('Malformed query parameters.'),
  },
})

const datasheetRoute = createRoute({
  method: 'get',
  path: '/factions/{faction}/datasheets/{id}',
  summary: 'Get one datasheet',
  request: { params: z.object({ faction: z.string(), id: z.string() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: datasheetResponseSchema } },
      description: 'The full datasheet.',
    },
    404: jsonError('No such datasheet.'),
  },
})

const keywordsRoute = createRoute({
  method: 'get',
  path: '/keywords',
  summary: 'List distinct keywords, optionally scoped to a faction',
  request: { query: z.object({ faction: z.string().optional() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: keywordsResponseSchema } },
      description: 'The distinct keywords, alphabetical.',
    },
  },
})

/** The read-only data routes, serving the baked artifact through `@auspex/data`. */
export function dataRoutes(db: Database) {
  return new OpenAPIHono({
    defaultHook: (result) => {
      if (!result.success) {
        throw badRequest('Invalid query parameters.')
      }
    },
  })
    .openapi(factionsRoute, (c) => c.json({ factions: listFactions(db) }, 200))
    .openapi(datasheetsRoute, (c) => {
      const { faction } = c.req.valid('param')
      const query = c.req.valid('query')
      const keywords = query.keywords
        ? query.keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
        : undefined
      return c.json(
        {
          datasheets: findDatasheets(db, {
            faction,
            ...(keywords && { keywords }),
            ...(query.maxPoints !== undefined && {
              maxPoints: query.maxPoints,
            }),
          }),
        },
        200
      )
    })
    .openapi(datasheetRoute, (c) => {
      const { faction, id } = c.req.valid('param')
      const datasheet = getDatasheet(db, faction, id)
      if (!datasheet) {
        throw notFound(`No datasheet "${id}" in ${faction}.`)
      }
      return c.json({ datasheet }, 200)
    })
    .openapi(keywordsRoute, (c) => {
      const { faction } = c.req.valid('query')
      return c.json({ keywords: listKeywords(db, faction) }, 200)
    })
}
