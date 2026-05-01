import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/e2e/**'],
    passWithNoTests: true,
  },
});
