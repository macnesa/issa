import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const reviewMocks = vi.hoisted(() => ({
  applyLocal: vi.fn().mockResolvedValue({}),
  discard: vi.fn().mockResolvedValue(undefined),
  retry: vi.fn().mockResolvedValue({}),
  useServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./attendanceOffline", () => ({
  applyAttendanceLocalConflict: reviewMocks.applyLocal,
  discardAttendanceMutation: reviewMocks.discard,
  retryAttendanceMutation: reviewMocks.retry,
  useAttendanceServerConflict: reviewMocks.useServer,
}));

import AttendanceSyncReview from "./AttendanceSyncReview";

const conflictRecord = {
  clientMutationId: "conflict-1",
  teacherId: 1,
  mutation: {
    clientMutationId: "conflict-1",
    type: "attendance.update",
    payload: {
      studentId: 7,
      attendanceDate: "2026-07-21",
      status: "Izin",
    },
  },
  conflict: {
    local: {
      studentId: 7,
      attendanceDate: "2026-07-21",
      status: "Izin",
      baseVersion: 4,
    },
    server: {
      studentId: 7,
      attendanceDate: "2026-07-21",
      status: "Sakit",
      version: 5,
      updatedAt: "2026-07-27T08:00:00.000Z",
    },
  },
};

function buildWorkspace(overrides = {}) {
  return {
    conflicts: [conflictRecord],
    failedMutations: [],
    onlineHint: true,
    refreshStatus: vi.fn().mockResolvedValue(undefined),
    syncNow: vi.fn().mockResolvedValue({ status: "processed" }),
    ...overrides,
  };
}

describe("Attendance conflict and rejected review UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows local/server values and Review later preserves the conflict", async () => {
    const workspace = buildWorkspace();
    render(<AttendanceSyncReview workspace={workspace} />);
    const trigger = screen.getByRole("button", { name: "Tinjau konflik" });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("2026-07-21");
    expect(dialog).toHaveTextContent("Izin");
    expect(dialog).toHaveTextContent("Sakit");
    fireEvent.click(screen.getByRole("button", { name: "Tinjau nanti" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(reviewMocks.useServer).not.toHaveBeenCalled();
    expect(reviewMocks.applyLocal).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tinjau konflik" }))
      .toHaveFocus();
  });

  test("Escape closes the keyboard-accessible dialog without resolution", async () => {
    render(<AttendanceSyncReview workspace={buildWorkspace()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tinjau konflik" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(reviewMocks.useServer).not.toHaveBeenCalled();
  });

  test("supports server conflict resolution", async () => {
    const workspace = buildWorkspace();
    render(<AttendanceSyncReview workspace={workspace} />);
    fireEvent.click(screen.getByRole("button", { name: "Tinjau konflik" }));
    fireEvent.click(await screen.findByRole("button", {
      name: "Gunakan data server",
    }));
    await waitFor(() => {
      expect(reviewMocks.useServer).toHaveBeenCalledWith(conflictRecord);
    });
    expect(workspace.syncNow).not.toHaveBeenCalled();
  });

  test("renders conflict action failures through the shared Flowbite notice", async () => {
    reviewMocks.useServer.mockRejectedValueOnce(new Error(
      "Resolusi konflik belum dapat diproses."
    ));
    render(<AttendanceSyncReview workspace={buildWorkspace()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tinjau konflik" }));
    fireEvent.click(await screen.findByRole("button", {
      name: "Gunakan data server",
    }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Resolusi konflik belum dapat diproses.");
    expect(alert).toHaveClass("issa-inline-notice--danger");
  });

  test("supports local conflict resolution and triggers sync", async () => {
    const workspace = buildWorkspace();
    render(<AttendanceSyncReview workspace={workspace} />);
    fireEvent.click(screen.getByRole("button", { name: "Tinjau konflik" }));
    fireEvent.click(await screen.findByRole("button", {
      name: "Terapkan perubahan saya",
    }));
    await waitFor(() => {
      expect(reviewMocks.applyLocal).toHaveBeenCalledWith(conflictRecord);
      expect(workspace.syncNow).toHaveBeenCalledTimes(1);
    });
  });

  test("failed Attendance exposes retry action", async () => {
    const failed = {
      clientMutationId: "failed-1",
      type: "attendance.update",
      payload: { attendanceDate: "2026-07-20" },
      lastErrorMessage: "Perubahan kehadiran perlu ditinjau.",
    };
    const workspace = buildWorkspace({
      conflicts: [],
      failedMutations: [failed],
    });
    render(<AttendanceSyncReview workspace={workspace} />);

    expect(screen.getByText("Perubahan kehadiran perlu ditinjau."))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    await waitFor(() => {
      expect(reviewMocks.retry).toHaveBeenCalledWith(failed);
    });
  });

  test("failed Attendance exposes discard action", async () => {
    const failed = {
      clientMutationId: "failed-1",
      type: "attendance.update",
      payload: { attendanceDate: "2026-07-20" },
      lastErrorMessage: "Perubahan kehadiran perlu ditinjau.",
    };
    const workspace = buildWorkspace({
      conflicts: [],
      failedMutations: [failed],
    });
    render(<AttendanceSyncReview workspace={workspace} />);

    fireEvent.click(screen.getByRole("button", {
      name: "Buang perubahan lokal",
    }));
    await waitFor(() => {
      expect(reviewMocks.discard).toHaveBeenCalledWith(failed);
    });
  });
});
