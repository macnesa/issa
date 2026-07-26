export function getOnlineHint() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function subscribeToConnectionStatus(onStatusChange) {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function reportApiConnection(available) {
  window.dispatchEvent(new CustomEvent("issa:api-connection-changed", {
    detail: { available: Boolean(available) },
  }));
}

export function subscribeToApiConnection(onStatusChange) {
  const handleConnectionChange = (event) => {
    onStatusChange(Boolean(event.detail?.available));
  };
  window.addEventListener(
    "issa:api-connection-changed",
    handleConnectionChange
  );
  return () => {
    window.removeEventListener(
      "issa:api-connection-changed",
      handleConnectionChange
    );
  };
}
