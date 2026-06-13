import { datasheetSchema } from '@auspex/schema'
import { z } from '@hono/zod-openapi'

/**
 * The API's wire contract: the request and response shapes, as zod schemas (which
 * also generate the OpenAPI spec) plus their inferred TypeScript types. This is the
 * single place the client and server agree on; the web imports these types directly.
 */

/** The error body every failed request returns. */
export const errorSchema = z
  .object({ error: z.object({ code: z.string(), message: z.string() }) })
  .openapi('Error')
export type ApiError = z.infer<typeof errorSchema>

// --- Data -------------------------------------------------------------------

/** A datasheet summary, as returned by the picker. */
export const datasheetSummarySchema = z
  .object({
    faction: z.string(),
    id: z.string(),
    name: z.string(),
    points: z.number().int(),
  })
  .openapi('DatasheetSummary')
export type DatasheetSummary = z.infer<typeof datasheetSummarySchema>

export const factionsResponseSchema = z.object({
  factions: z.array(z.string()),
})
export type FactionsResponse = z.infer<typeof factionsResponseSchema>

export const datasheetsResponseSchema = z.object({
  datasheets: z.array(datasheetSummarySchema),
})
export type DatasheetsResponse = z.infer<typeof datasheetsResponseSchema>

export const datasheetResponseSchema = z.object({ datasheet: datasheetSchema })
export type DatasheetResponse = z.infer<typeof datasheetResponseSchema>

export const keywordsResponseSchema = z.object({
  keywords: z.array(z.string()),
})
export type KeywordsResponse = z.infer<typeof keywordsResponseSchema>

/** Query parameters for the datasheet filter. */
export const datasheetFilterQuerySchema = z.object({
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
})

// --- Lists ------------------------------------------------------------------

/** A stored army list on the wire (timestamps are ISO strings). */
export const armyListSchema = z
  .object({
    id: z.string(),
    owner: z.string(),
    name: z.string(),
    faction: z.string(),
    body: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ArmyList')
export type ArmyListDto = z.infer<typeof armyListSchema>

/** A resolution diagnostic, source-mapped to the DSL. */
export const diagnosticSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  line: z.number().int().optional(),
  column: z.number().int().optional(),
})
export type DiagnosticDto = z.infer<typeof diagnosticSchema>

/** A list's DSL resolved into a costed army plus diagnostics. */
export const resolvedListSchema = z
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
    diagnostics: z.array(diagnosticSchema),
  })
  .openapi('ResolvedList')
export type ResolvedListDto = z.infer<typeof resolvedListSchema>

export const createListBodySchema = z.object({
  name: z.string().min(1),
  faction: z.string().min(1),
  body: z.string().min(1),
})
export type CreateListBody = z.infer<typeof createListBodySchema>

export const updateListBodySchema = z.object({
  name: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
})
export type UpdateListBody = z.infer<typeof updateListBodySchema>

export const listResponseSchema = z.object({ list: armyListSchema })
export type ListResponse = z.infer<typeof listResponseSchema>

export const listsResponseSchema = z.object({ lists: z.array(armyListSchema) })
export type ListsResponse = z.infer<typeof listsResponseSchema>

export const getListResponseSchema = z.object({
  list: armyListSchema,
  resolved: resolvedListSchema,
})
export type GetListResponse = z.infer<typeof getListResponseSchema>
