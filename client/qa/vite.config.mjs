// Optional local QA relay: the backend's development CORS allowlist is fixed
// to port 3100. Keep production config and existing servers untouched.
import config from '../vite.config.mjs';
const proxy = Object.fromEntries(['/users', '/public', '/students', '/socket.io'].map((path) => [path, {
  target: 'http://localhost:3002', changeOrigin: true, ws: path === '/socket.io',
  headers: { origin: 'http://localhost:3100' },
}]));
export default {
  ...config,
  esbuild: { ...config.esbuild, include: /(?:src|qa)\/.*\.jsx?$/ },
  server: { ...config.server, port: 3102, strictPort: true, proxy },
};
