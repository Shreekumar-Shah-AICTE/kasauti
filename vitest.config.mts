import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/core/**/*.ts',
        'src/ai/**/*.ts',
        'src/server/**/*.ts',
        'src/lib/**/*.ts',
        'src/samples/**/*.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/ai/gemini.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
