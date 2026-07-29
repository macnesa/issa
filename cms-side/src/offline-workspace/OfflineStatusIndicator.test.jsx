import { primaryStatus } from "./OfflineStatusIndicator";

const connectedWorkspace = Object.freeze({
  onlineHint: true,
  connectionAvailable: true,
  syncRunning: false,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
});

describe("OfflineStatusIndicator status labels", () => {
  test("shows Offline when application connectivity is unavailable", () => {
    expect(primaryStatus({
      ...connectedWorkspace,
      connectionAvailable: false,
    })).toBe("Offline");
  });

  test("shows Online for connectivity without claiming synchronization", () => {
    expect(primaryStatus(connectedWorkspace)).toBe("Online");
  });

  test("shows Menunggu sinkronisasi for confirmed pending local changes", () => {
    expect(primaryStatus({
      ...connectedWorkspace,
      pendingCount: 2,
    })).toBe("Menunggu sinkronisasi");
  });

  test("shows the active synchronization state", () => {
    expect(primaryStatus({
      ...connectedWorkspace,
      syncRunning: true,
    })).toBe("Menyinkronkan…");
  });

  test("preserves explicit conflict and failure states", () => {
    expect(primaryStatus({
      ...connectedWorkspace,
      conflictCount: 1,
    })).toBe("1 perlu ditinjau");
    expect(primaryStatus({
      ...connectedWorkspace,
      failedCount: 1,
    })).toBe("1 gagal disinkronkan");
  });
});
