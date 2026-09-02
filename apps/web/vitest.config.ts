import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/**/*.smoke.test.ts', 'node_modules'],
  },
  esbuild: {
    jsx: 'automatic',
  },
});
