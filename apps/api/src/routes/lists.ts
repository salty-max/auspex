import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Database } from 'bun:sqlite'

import {
  type AuthProvider,
  type AuthVariables,
  requireUser,
} from '../auth/provider'
import {
  type ArmyListDto,
  createListBodySchema,
  errorSchema,
  getListResponseSchema,
  listResponseSchema,
  listsResponseSchema,
  updateListBodySchema,
} from '../contract'
import { badRequest, notFound } from '../errors'
import type { ArmyListRecord, ListRepository } from '../lists/repository'
import { resolveBody } from '../lists/resolve'

/** The dependencies the list routes need. */
export interface ListRoutesDeps {
  lists: ListRepository
  /** The baked data artifact, for resolving a list on read. */
  data: Database
  auth: AuthProvider
}

const jsonError = (description: string) => ({
  content: { 'application/json': { schema: errorSchema } },
  description,
})

const json = <T extends z.ZodTypeAny>(schema: T, description: string) => ({
  content: { 'application/json': { schema } },
  description,
})

/** Serialize a stored record for the wire (dates as ISO strings). */
function serialize(record: ArmyListRecord): ArmyListDto {
  return {
    id: record.id,
    owner: record.owner,
    name: record.name,
    faction: record.faction,
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

const unauthorized = jsonError('Authentication required.')

const createListRoute = createRoute({
  method: 'post',
  path: '/lists',
  summary: 'Create an army list',
  request: {
    body: { content: { 'application/json': { schema: createListBodySchema } } },
  },
  responses: {
    201: json(listResponseSchema, 'The created list.'),
    400: jsonError('Malformed body.'),
    401: unauthorized,
  },
})

const listListsRoute = createRoute({
  method: 'get',
  path: '/lists',
  summary: 'List the signed-in user’s army lists',
  responses: {
    200: json(listsResponseSchema, 'The lists.'),
    401: unauthorized,
  },
})

const getListRoute = createRoute({
  method: 'get',
  path: '/lists/{id}',
  summary: 'Get one list, resolved against the data',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: json(getListResponseSchema, 'The list and its resolved, costed army.'),
    401: unauthorized,
    404: jsonError('No such list.'),
  },
})

const updateListRoute = createRoute({
  method: 'patch',
  path: '/lists/{id}',
  summary: 'Update a list',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateListBodySchema } } },
  },
  responses: {
    200: json(listResponseSchema, 'The updated list.'),
    400: jsonError('Malformed body.'),
    401: unauthorized,
    404: jsonError('No such list.'),
  },
})

const deleteListRoute = createRoute({
  method: 'delete',
  path: '/lists/{id}',
  summary: 'Delete a list',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Deleted.' },
    401: unauthorized,
    404: jsonError('No such list.'),
  },
})

/** The army-list CRUD routes — authenticated and scoped to the owning user. */
export function listRoutes(deps: ListRoutesDeps) {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>({
    defaultHook: (result) => {
      if (!result.success) {
        throw badRequest('Invalid request body.')
      }
    },
  })
  app.use('*', requireUser(deps.auth))

  return app
    .openapi(createListRoute, async (c) => {
      const list = await deps.lists.create(c.get('userId'), c.req.valid('json'))
      return c.json({ list: serialize(list) }, 201)
    })
    .openapi(listListsRoute, async (c) => {
      const records = await deps.lists.list(c.get('userId'))
      return c.json({ lists: records.map(serialize) }, 200)
    })
    .openapi(getListRoute, async (c) => {
      const { id } = c.req.valid('param')
      const record = await deps.lists.get(c.get('userId'), id)
      if (!record) {
        throw notFound(`No list "${id}".`)
      }
      return c.json(
        {
          list: serialize(record),
          resolved: resolveBody(record.body, deps.data),
        },
        200
      )
    })
    .openapi(updateListRoute, async (c) => {
      const { id } = c.req.valid('param')
      const record = await deps.lists.update(
        c.get('userId'),
        id,
        c.req.valid('json')
      )
      if (!record) {
        throw notFound(`No list "${id}".`)
      }
      return c.json({ list: serialize(record) }, 200)
    })
    .openapi(deleteListRoute, async (c) => {
      const { id } = c.req.valid('param')
      const removed = await deps.lists.remove(c.get('userId'), id)
      if (!removed) {
        throw notFound(`No list "${id}".`)
      }
      return c.body(null, 204)
    })
}
