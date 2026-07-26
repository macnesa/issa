import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const offlineMocks = vi.hoisted(() => ({
  syncNow: vi.fn().mockResolvedValue({ status: "idle" }),
  dispose: vi.fn(),
  openDatabase: vi.fn().mockResolvedValue({}),
  resetInterrupted: vi.fn().mockResolvedValue(0),
  updateMetadata: vi.fn().mockResolvedValue({}),
}));

vi.mock("./authIdentity", () => ({
  getActiveTeacherIdentity: vi.fn(() => ({ id: 9, name: "Guru Demo" })),
}));
vi.mock("./offlineDatabase", () => ({
  openOfflineDatabase: offlineMocks.openDatabase,
}));
vi.mock("./mutationQueue", () => ({
  getSyncMetadata: vi.fn().mockResolvedValue(null),
  listSyncConflicts: vi.fn().mockResolvedValue([]),
  listTeacherMutations: vi.fn().mockResolvedValue([]),
  resetInterruptedSyncingMutations: offlineMocks.resetInterrupted,
  updateSyncMetadata: offlineMocks.updateMetadata,
}));
vi.mock("./syncEngine", () => ({
  createTeacherSyncEngine: vi.fn(() => ({
    dispose: offlineMocks.dispose,
    syncNow: offlineMocks.syncNow,
  })),
}));

import { OfflineWorkspaceProvider } from "./OfflineWorkspaceProvider";
import OfflineStatusIndicator from "./OfflineStatusIndicator";

function setOnlineHint(value) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("offline workspace app lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnlineHint(false);
  });

  test("boot recovers interrupted items but does not sync while offline", async () => {
    render(
      <OfflineWorkspaceProvider>
        <OfflineStatusIndicator />
      </OfflineWorkspaceProvider>
    );

    expect(screen.getAllByText("Offline")).toHaveLength(2);
    await waitFor(() => {
      expect(offlineMocks.resetInterrupted).toHaveBeenCalledWith(9);
    });
    expect(offlineMocks.syncNow).not.toHaveBeenCalled();
  });

  test("online event and Sync now each trigger one engine call", async () => {
    render(
      <OfflineWorkspaceProvider>
        <OfflineStatusIndicator />
      </OfflineWorkspaceProvider>
    );
    await waitFor(() => {
      expect(offlineMocks.resetInterrupted).toHaveBeenCalled();
    });

    setOnlineHint(true);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await Promise.resolve();
    });
    await waitFor(() => expect(offlineMocks.syncNow).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByText("Tersinkron"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", {
        name: "Sinkronkan sekarang",
      }));
      await Promise.resolve();
    });
    await waitFor(() => expect(offlineMocks.syncNow).toHaveBeenCalledTimes(2));
  });

  test("real API failure overrides an optimistic browser online hint", async () => {
    setOnlineHint(true);
    render(
      <OfflineWorkspaceProvider>
        <OfflineStatusIndicator />
      </OfflineWorkspaceProvider>
    );
    await waitFor(() => {
      expect(offlineMocks.resetInterrupted).toHaveBeenCalled();
    });

    act(() => {
      window.dispatchEvent(new CustomEvent("issa:api-connection-changed", {
        detail: { available: false },
      }));
    });

    expect(screen.getAllByText("Offline")).toHaveLength(2);
  });
});
