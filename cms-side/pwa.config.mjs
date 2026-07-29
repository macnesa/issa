export const offlineAppShellPwaOptions = {
  injectRegister: false,
  manifest: false,
  registerType: 'autoUpdate',
  workbox: {
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api(?:\/|$)/],
    runtimeCaching: [],
    skipWaiting: true,
  },
};
