import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  deleteOfflineDatabaseForTests,
} from "../../../offline-workspace/offlineDatabase";
import {
  listTeacherMutations,
} from "../../../offline-workspace/mutationQueue";

const attendanceUiMocks = vi.hoisted(() => ({
  connectionAvailable: true,
  dispatch: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => attendanceUiMocks.dispatch,
}));
vi.mock("../../../offline-workspace/OfflineWorkspaceProvider", () => ({
  useOfflineWorkspace: () => ({
    connectionAvailable: attendanceUiMocks.connectionAvailable,
    teacherIdentity: { id: 1, name: "Guru Demo" },
  }),
}));

import TableAttendances from "./TableAttendance";

const attendanceRouteSource = readFileSync("src/pages/Attendance.jsx", "utf8");

const student = {
  id: 7,
  NIM: "2026071001",
  name: "Ari Wibowo",
  imgUrl: "/ari.png",
  Class: { id: 1, name: "1A" },
  Attendances: [{
    id: 31,
    StudentId: 7,
    attendanceDate: "2026-07-21",
    status: "Hadir",
    version: 4,
  }],
};

describe("production Attendance update path", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    attendanceUiMocks.connectionAvailable = true;
    await deleteOfflineDatabaseForTests();
  });

  afterAll(async () => {
    await deleteOfflineDatabaseForTests();
  });

  test("existing online Attendance update uses durable queue, not legacy PUT", async () => {
    render(
      <table>
        <tbody>
          <TableAttendances
            data={student}
            attendanceDate="2026-07-21"
          />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByRole("button", { name: "Izin — Ari Wibowo" }));

    await waitFor(async () => {
      expect(await listTeacherMutations(1)).toEqual([
        expect.objectContaining({
          baseVersion: 4,
          payload: expect.objectContaining({ status: "Izin" }),
        }),
      ]);
    });
    expect(attendanceUiMocks.dispatch).not.toHaveBeenCalled();
  });

  test("menyediakan semua label row untuk presentasi responsif", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableAttendances
            data={student}
            attendanceDate="2026-07-21"
          />
        </tbody>
      </table>
    );

    expect(container.querySelector('[data-label="Kelas"]')).toHaveTextContent("1A");
    expect(container.querySelector('[data-label="Status kehadiran"]'))
      .toContainElement(screen.getByRole("button", { name: "Hadir — Ari Wibowo" }));
    expect(container.querySelector('[data-label="Record"]'))
      .toContainElement(screen.getByRole("button", { name: "Lihat riwayat" }));
    expect(container.querySelector(".attendance-register__row"))
      .toHaveClass("max-lg:grid");
    expect(attendanceRouteSource)
      .toMatch(/attendance-register__table[^"]*\bmin-w-0\b/);
  });

  test("refreshes the owning list after a new online Attendance is created", async () => {
    const onAttendanceSaved = vi.fn().mockResolvedValue(undefined);
    attendanceUiMocks.dispatch.mockResolvedValueOnce({ id: 88 });
    render(
      <table>
        <tbody>
          <TableAttendances
            data={{ ...student, Attendances: [] }}
            attendanceDate="2026-07-22"
            onAttendanceSaved={onAttendanceSaved}
          />
        </tbody>
      </table>
    );

    fireEvent.click(screen.getByRole("button", { name: "Hadir — Ari Wibowo" }));

    await waitFor(() => expect(onAttendanceSaved).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Kehadiran dicatat.")).toBeInTheDocument();
  });

  test("Attendance create remains online-only", async () => {
    attendanceUiMocks.connectionAvailable = false;
    render(
      <table>
        <tbody>
          <TableAttendances
            data={{ ...student, Attendances: [] }}
            attendanceDate="2026-07-22"
          />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByRole("button", { name: "Hadir — Ari Wibowo" }));

    expect(await screen.findByText(
      "Kehadiran baru hanya dapat dicatat saat online."
    )).toBeInTheDocument();
    expect(attendanceUiMocks.dispatch).not.toHaveBeenCalled();
    expect(await listTeacherMutations(1)).toEqual([]);
  });
});
