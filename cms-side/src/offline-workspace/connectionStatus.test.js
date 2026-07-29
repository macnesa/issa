import {
  getOnlineHint,
  reportApiConnection,
  subscribeToApiConnection,
  subscribeToConnectionStatus,
} from "./connectionStatus";

describe("connection status hints", () => {
  test("online and offline browser events update status without touching data", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToConnectionStatus(listener);

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(listener.mock.calls).toEqual([[false], [true]]);
    unsubscribe();
    window.dispatchEvent(new Event("offline"));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(typeof getOnlineHint()).toBe("boolean");
  });

  test("a real API request result is exposed separately from navigator hint", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToApiConnection(listener);

    reportApiConnection(false);
    reportApiConnection(true);

    expect(listener.mock.calls).toEqual([[false], [true]]);
    unsubscribe();
  });
});
