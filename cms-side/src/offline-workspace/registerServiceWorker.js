import { registerSW } from "virtual:pwa-register";

export function registerOfflineAppShell() {
  if (!("serviceWorker" in navigator)) return;
  registerSW({
    immediate: true,
  });
}
