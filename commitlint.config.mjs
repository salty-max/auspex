/**
 * Conventional-commit config for auspex.
 *
 * Workspace scopes are auto-generated from `packages/` and `apps/` directories:
 * a new package's scope is enabled the moment its directory exists, and a typo
 * (`engien`) is rejected because no such directory exists at lint time. The
 * hand-listed scopes carry semantic weight for changes outside any workspace
 * (`tooling` = lint/format/hooks config, `meta` = top-level repo files, …).
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const workspaceScopes = ['packages', 'apps']
  .map((root) => path.resolve(__dirname, root))
  .filter((root) => existsSync(root))
  .flatMap((root) =>
    readdirSync(root).filter((entry) =>
      statSync(path.join(root, entry)).isDirectory()
    )
  )
  .sort()

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [...workspaceScopes, 'deps', 'tooling', 'ci', 'docs', 'meta'],
    ],
  },
}
