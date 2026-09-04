import {
  defineConfig,
  loadEnv,
  transformWithEsbuild,
} from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { offlineAppShellPwaOptions } from './pwa.config.mjs';

const localApiHostnames = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

function assertDeployableApiConfiguration(mode) {
  const configuredApiBaseUrl = loadEnv(
    mode,
    process.cwd(),
    'VITE_'
  ).VITE_API_BASE_URL?.trim();
  if (!configuredApiBaseUrl) return;

  let configuredUrl;
  try {
    configuredUrl = new URL(configuredApiBaseUrl);
  } catch (error) {
    throw new Error('VITE_API_BASE_URL must be a valid absolute URL.');
  }

  if (localApiHostnames.has(configuredUrl.hostname)) {
    throw new Error(
      'Production build blocked: VITE_API_BASE_URL points to a localhost API. Use an explicit deployable API URL.'
    );
  }
}

const jsxInLegacyJsFiles = {
  name: 'jsx-in-legacy-js-files',
  enforce: 'pre',
  async transform(code, id) {
    if (id.includes('/src/') && id.endsWith('.js')) {
      return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
    }
  },
};

export default defineConfig(({ command, mode }) => {
  if (command === 'build') assertDeployableApiConfiguration(mode);

  return {
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
  };
});
