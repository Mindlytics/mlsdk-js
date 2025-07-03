import { defineConfig } from 'vitest/config'

export default defineConfig({
  ssr: {
    resolve: {
      conditions: ['ml-dev'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    testTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
      ],
    },
  },
})
