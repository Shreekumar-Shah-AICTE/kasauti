import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Node by default; component tests opt into jsdom with a `@vitest-environment` docblock.
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
      exclude: ['src/**/*.test.ts', 'src/ai/gemini.ts', 'src/lib/pdf/extractPages.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
