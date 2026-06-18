import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import prettierPlugin from 'eslint-plugin-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import * as regexpPlugin from 'eslint-plugin-regexp'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unicornPlugin from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

const sharedRules = {
  'no-unused-vars': 'off',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],

  // Imports / exports.
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  'import/no-cycle': ['error', { maxDepth: 10 }],
  'import/no-duplicates': 'error',
  'import/no-self-import': 'error',
  'import/first': 'error',
  'import/newline-after-import': 'error',

  // Prettier integration.
  'prettier/prettier': 'error',

  // Unicorn — opinionated, curated to drop noise.
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-string-starts-ends-with': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/prefer-module': 'error',
  'unicorn/prefer-spread': 'error',
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],
  'unicorn/prevent-abbreviations': 'off', // 'mods', 'dist', 'p' are fine
  'unicorn/no-array-reduce': 'off', // reduce is idiomatic on distributions
  'unicorn/prefer-ternary': 'off', // an if/else block is often clearer
}

const srcRules = {
  ...sharedRules,

  // JSDoc — every exported declaration carries a prose doc comment. The
  // descriptions name the parameters inline, so @param/@returns tags are
  // not required.
  'jsdoc/require-jsdoc': [
    'error',
    {
      publicOnly: true,
      require: {
        FunctionDeclaration: true,
        ArrowFunctionExpression: true,
        ClassDeclaration: true,
        MethodDefinition: true,
      },
      contexts: [
        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type=/(Arrow)?FunctionExpression/]',
        'ExportNamedDeclaration > FunctionDeclaration',
      ],
    },
  ],
  'jsdoc/require-description': 'error',
  'jsdoc/check-tag-names': 'error',
  'jsdoc/no-types': 'error', // TS already provides types; redundant in JSDoc
  'jsdoc/require-param': 'off',
  'jsdoc/require-returns': 'off',
  'jsdoc/tag-lines': 'off', // prettier handles spacing
}

const sharedPlugins = {
  prettier: prettierPlugin,
  'simple-import-sort': simpleImportSort,
  import: importPlugin,
  unicorn: unicornPlugin,
}

export default [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '.turbo/**',
    ],
  },

  // Library and backend source — full ruleset including type-checked rules and
  // JSDoc. The web app is a React SPA with different conventions (below).
  ...tseslint.config({
    files: ['packages/*/src/**/*.{ts,tsx}', 'apps/api/src/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      jsdocPlugin.configs['flat/recommended-typescript'],
      regexpPlugin.configs['flat/recommended'],
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ...sharedPlugins,
      jsdoc: jsdocPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      ...srcRules,
    },
  }),

  // Web app — React SPA. Type-checked rules + the hooks rules; no JSDoc, since
  // components document themselves. PascalCase component files are allowed.
  ...tseslint.config({
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      regexpPlugin.configs['flat/recommended'],
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ...sharedPlugins,
      'react-hooks': reactHooks,
    },
    rules: {
      ...prettierConfig.rules,
      ...sharedRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'unicorn/filename-case': [
        'error',
        { cases: { kebabCase: true, pascalCase: true } },
      ],
    },
  }),

  // Tests — recommended (no type-checked rules, no JSDoc requirements).
  ...tseslint.config({
    files: ['packages/*/tests/**/*.{ts,tsx}', 'apps/*/tests/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      regexpPlugin.configs['flat/recommended'],
    ],
    plugins: sharedPlugins,
    rules: {
      ...prettierConfig.rules,
      ...sharedRules,
    },
  }),

  // One-shot CLI tooling (e.g. the icon import script) — Bun scripts whose job
  // is to print progress, so `console` is allowed.
  {
    files: ['apps/*/scripts/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]
