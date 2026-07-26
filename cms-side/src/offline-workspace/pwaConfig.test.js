import { offlineAppShellPwaOptions } from "../../pwa.config.mjs";

describe("offline app shell PWA configuration", () => {
  test("uses index navigation fallback and no API runtime caching", () => {
    expect(offlineAppShellPwaOptions.workbox).toEqual(expect.objectContaining({
      cleanupOutdatedCaches: true,
      navigateFallback: "/index.html",
      runtimeCaching: [],
    }));
    expect(
      offlineAppShellPwaOptions.workbox.navigateFallbackDenylist[0]
        .test("/api/students/7")
    ).toBe(true);
    expect(
      offlineAppShellPwaOptions.workbox.navigateFallbackDenylist[0]
        .test("/students/7")
    ).toBe(false);
  });

  test("static HTML, JavaScript, and CSS are included in precache patterns", () => {
    expect(offlineAppShellPwaOptions.workbox.globPatterns).toEqual([
      "**/*.{js,css,html,ico,png,svg,woff2}",
    ]);
    expect(offlineAppShellPwaOptions.injectRegister).toBe(false);
    expect(offlineAppShellPwaOptions.registerType).toBe("autoUpdate");
    expect(offlineAppShellPwaOptions.workbox.clientsClaim).toBe(true);
    expect(offlineAppShellPwaOptions.workbox.skipWaiting).toBe(true);
  });
});
