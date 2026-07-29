import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { offlineAppShellPwaOptions } from './pwa.config.mjs';

const jsxInLegacyJsFiles = {
  name: 'jsx-in-legacy-js-files',
  enforce: 'pre',
  async transform(code, id) {
    if (id.includes('/src/') && id.endsWith('.js')) {
      return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
    }
  },
};

export default defineConfig({
  plugins: [
    jsxInLegacyJsFiles,
    react(),
    VitePWA(offlineAppShellPwaOptions),
  ],
  server: {
    port: 3001,
    strictPort: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
