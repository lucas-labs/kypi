import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // @ts-expect-error: Vite type mismatch due to multiple Vite versions when using bun + tsdown's vite
  plugins: [react()],
  test: {
    pool: 'vmThreads',
    environment: 'happy-dom',
    globals: true,
    setupFiles: './tests/setup.ts',
    server: {
      deps: {
        inline: [/^(?!.*node_modules)/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'lcov'],
      exclude: [
        'playground/**',
        'tsdown.config.ts',
        'dist/**',
        'node_modules/**',
        'eslint.config.js',
        'vitest.config.ts',
        '*.d.ts',
        '*.js',
        '!src/**',
        'bump.config.ts',
      ],
    },
  },
})
