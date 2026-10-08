import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for src/lib. Pure logic only: no network, no database, no Next.js server.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 'server-only' throws outside a React Server Component bundle; it is a no-op in tests
      'server-only': fileURLToPath(new URL('./src/test/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
});
