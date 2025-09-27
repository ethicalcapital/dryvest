import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'test' ? null : cloudflare({ configPath: '../wrangler.toml' }),
  ].filter(Boolean),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'functions/**/*.test.ts'],
    css: false,
  },
}));
