import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Database } from 'bun:sqlite'

import { badRequest, notFound } from '../errors'
import type { ArmyListRecord, ListRepository } from '../lists/repository'
import { resolveBody } from '../lists/resolve'

/** The dependencies the list routes need. */
export interface ListRoutesDeps {
  lists: ListRepository
  /** The baked data artifact, for resolving a list on read. */
  data: Database
}

const ErrorSchema = z
  .object({ error: z.object({ code: z.string(), message: z.string() }) })
  .openapi('Error')

const ListSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    faction: z.string(),
    body: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ArmyList')

const DiagnosticSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  line: z.number().int().optional(),
  column: z.number().int().optional(),
})

const ResolvedSchema = z
  .object({
    army: z
      .object({
        totalPoints: z.number().int(),
        units: z.array(
          z.object({
            name: z.string(),
            models: z.number().int(),
            points: z.number().int(),
            datasheetId: z.string(),
          })
        ),
      })
      .nullable(),
    diagnostics: z.array(DiagnosticSchema),
  })
  .openapi('ResolvedList')

const CreateBody = z.object({
  name: z.string().min(1),
  faction: z.string().min(1),
  body: z.string().min(1),
})

const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
})

const jsonError = (description: string) => ({
  content: { 'application/json': { schema: ErrorSchema } },
  description,
})

const json = <T extends z.ZodTypeAny>(schema: T, description: string) => ({
  content: { 'application/json': { schema } },
  description,
})

/** Serialize a stored record for the wire (dates as ISO strings). */
function serialize(record: ArmyListRecord) {
  return {
    id: record.id,
    name: record.name,
    faction: record.faction,
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

const createListRoute = createRoute({
  method: 'post',
  path: '/lists',
  summary: 'Create an army list',
  request: {
    body: { content: { 'application/json': { schema: CreateBody } } },
  },
  responses: {
    201: json(z.object({ list: ListSchema }), 'The created list.'),
    400: jsonError('Malformed body.'),
  },
})

const listListsRoute = createRoute({
  method: 'get',
  path: '/lists',
  summary: 'List every army list',
  responses: {
    200: json(z.object({ lists: z.array(ListSchema) }), 'The lists.'),
  },
})

const getListRoute = createRoute({
  method: 'get',
  path: '/lists/{id}',
  summary: 'Get one list, resolved against the data',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: json(
      z.object({ list: ListSchema, resolved: ResolvedSchema }),
      'The list and its resolved, costed army.'
    ),
    404: jsonError('No such list.'),
  },
})

const updateListRoute = createRoute({
  method: 'patch',
  path: '/lists/{id}',
  summary: 'Update a list',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdateBody } } },
  },
  responses: {
    200: json(z.object({ list: ListSchema }), 'The updated list.'),
    400: jsonError('Malformed body.'),
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
    404: jsonError('No such list.'),
  },
})

/** The army-list CRUD routes, resolving the DSL on read. */
export function listRoutes(deps: ListRoutesDeps): OpenAPIHono {
  const app = new OpenAPIHono({
    defaultHook: (result) => {
      if (!result.success) {
        throw badRequest('Invalid request body.')
      }
    },
  })

  app.openapi(createListRoute, async (c) => {
    const input = c.req.valid('json')
    const list = await deps.lists.create(input)
    return c.json({ list: serialize(list) }, 201)
  })

  app.openapi(listListsRoute, async (c) => {
    const records = await deps.lists.list()
    return c.json({ lists: records.map(serialize) }, 200)
  })

  app.openapi(getListRoute, async (c) => {
    const { id } = c.req.valid('param')
    const record = await deps.lists.get(id)
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

  app.openapi(updateListRoute, async (c) => {
    const { id } = c.req.valid('param')
    const record = await deps.lists.update(id, c.req.valid('json'))
    if (!record) {
      throw notFound(`No list "${id}".`)
    }
    return c.json({ list: serialize(record) }, 200)
  })

  app.openapi(deleteListRoute, async (c) => {
    const { id } = c.req.valid('param')
    const removed = await deps.lists.remove(id)
    if (!removed) {
      throw notFound(`No list "${id}".`)
    }
    return c.body(null, 204)
  })

  return app
}
