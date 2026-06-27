import { sxzz } from '@sxzz/eslint-config'

const packageJsonKeyOrder = [
  'publisher',
  'name',
  'displayName',
  'type',
  'version',
  'private',
  'packageManager',
  'description',
  'author',
  'contributors',
  'license',
  'funding',
  'homepage',
  'repository',
  'bugs',
  'keywords',
  'categories',
  'sideEffects',
  'imports',
  'exports',
  'main',
  'module',
  'unpkg',
  'jsdelivr',
  'types',
  'typesVersions',
  'bin',
  'icon',
  'files',
  'engines',
  'activationEvents',
  'contributes',
  'scripts',
  'peerDependencies',
  'peerDependenciesMeta',
  'dependencies',
  'inlinedDependencies',
  'optionalDependencies',
  'devDependencies',
  'pnpm',
  'overrides',
  'resolutions',
  'husky',
  'simple-git-hooks',
  'lint-staged',
  'eslintConfig',
  'prettier',
  'tsdown',
]

export default sxzz(
  {},
  {
    ignores: ['readme.md'],
  },
)
  .removeRules('node/prefer-global/process')
  .append({
    files: ['**/package.json'],
    name: 'kypi/package-json-order',
    rules: {
      'jsonc/sort-keys': [
        'error',
        {
          order: packageJsonKeyOrder,
          pathPattern: '^$',
        },
        {
          order: { type: 'asc' },
          pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$',
        },
        {
          order: ['types', 'import', 'require', 'default'],
          pathPattern: '^exports.*$',
        },
        {
          order: { type: 'asc' },
          pathPattern: String.raw`^(?:resolutions|overrides|pnpm\.overrides)$`,
        },
      ],
    },
  })
