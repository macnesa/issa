import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [jsxInLegacyJsFiles, react()],
  server: {
    port: 3001,
    strictPort: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
