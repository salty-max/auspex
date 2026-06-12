import { XMLParser } from 'fast-xml-parser'

/** A parsed BSData XML node: attributes are prefixed with `@`. */
export type XmlNode = Record<string, unknown>

const ARRAY_NODES = new Set([
  'selectionEntry',
  'selectionEntryGroup',
  'entryLink',
  'infoLink',
  'profile',
  'characteristic',
  'categoryLink',
  'cost',
  'constraint',
])

/** Parse a BSData catalogue file into a navigable tree. */
export function parseCatalogueXml(xml: string): XmlNode {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    isArray: (name) => ARRAY_NODES.has(name),
    processEntities: true,
  })
  const doc = parser.parse(xml) as XmlNode
  const catalogue = doc.catalogue as XmlNode | undefined
  if (!catalogue) {
    throw new Error('Not a BSData catalogue (missing <catalogue> root)')
  }
  return catalogue
}

/** Typed access helpers — the XML tree is untyped by nature. */
export function attr(node: XmlNode, name: string): string | undefined {
  const value = node[`@${name}`]
  return typeof value === 'string' ? value : undefined
}

/** The array of child nodes at `path`, normalizing single nodes to one-element arrays. */
export function children(node: XmlNode, ...path: string[]): XmlNode[] {
  let current: unknown = node
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return []
    current = (current as XmlNode)[key]
  }
  if (current === undefined) return []
  return Array.isArray(current) ? (current as XmlNode[]) : [current as XmlNode]
}

/** The text content of a characteristic node (fast-xml-parser uses `#text`). */
export function text(node: XmlNode): string {
  const value = node['#text']
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

/**
 * Index every identifiable shared entity (selection entries, groups, profiles)
 * by id so `entryLink`/`infoLink` targets can be resolved.
 */
export function indexById(catalogue: XmlNode): Map<string, XmlNode> {
  const index = new Map<string, XmlNode>()
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (typeof node !== 'object' || node === null) return
    const record = node as XmlNode
    const id = attr(record, 'id')
    if (id) index.set(id, record)
    for (const [key, value] of Object.entries(record)) {
      if (!key.startsWith('@') && key !== '#text') walk(value)
    }
  }
  walk(catalogue)
  return index
}
