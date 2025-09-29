import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'test' ? null : cloudflare({ configPath: '../wrangler.toml' }),
  ].filter(Boolean),
  resolve: {
    alias: {
      zod: resolve(projectRoot, 'node_modules/zod'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'functions/**/*.test.ts'],
    css: false,
  },
}));
