import { sxzz } from '@sxzz/eslint-config'

export default sxzz(
  {},
  {
    ignores: ['readme.md'],
  },
).removeRules('node/prefer-global/process')
