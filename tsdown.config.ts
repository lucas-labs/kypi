import { codecovRollupPlugin } from '@codecov/rollup-plugin'
import { defineConfig } from 'tsdown'

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
    }),
  ],
})
