import { codecovRollupPlugin } from '@codecov/rollup-plugin'
import { defineConfig } from 'tsdown'

console.info('\nBuilding kypi with tsdown...')
console.info(
  `📊 Bundle analysis is ${process.env.CODECOV_TOKEN ? 'ENABLED' : 'DISABLED'} for this build.\n`,
)

export default defineConfig({
  entry: ['src/index.ts', 'src/react/index.ts'],
  outDir: 'dist',
  platform: 'neutral',
  dts: true,
  plugins: [
    codecovRollupPlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      uploadToken: process.env.CODECOV_TOKEN,
      bundleName: 'kypi',
      gitService: 'github',
    }),
  ],
})
