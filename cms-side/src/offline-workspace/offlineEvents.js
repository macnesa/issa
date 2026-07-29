export const offlineWorkspaceChangedEvent =
  "issa:offline-workspace-changed";

export function notifyOfflineWorkspaceChanged(detail = {}) {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  window.dispatchEvent(new CustomEvent(offlineWorkspaceChangedEvent, {
    detail,
  }));
}

export function subscribeToOfflineWorkspaceChanges(listener) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }
  window.addEventListener(offlineWorkspaceChangedEvent, listener);
  return () => {
    window.removeEventListener(offlineWorkspaceChangedEvent, listener);
  };
}
