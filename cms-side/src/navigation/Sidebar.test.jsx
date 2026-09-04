import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";
import { saveLastKnownTeacherIdentity } from "../offline-workspace/authIdentity";

const sidebarMocks = vi.hoisted(() => ({
  clearTeacherData: vi.fn().mockResolvedValue(undefined),
  hasUnsyncedAttendance: vi.fn().mockResolvedValue(false),
}));

function unsignedTeacherToken(accessMode) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `${encode({ alg: "none" })}.${encode({ role: "teacher", teacherId: 9, accessMode })}.`;
}

vi.mock("../offline-workspace/mutationQueue", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, clearTeacherOfflineData: sidebarMocks.clearTeacherData };
});
vi.mock("../offline-workspace/attendanceOffline", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, hasUnsyncedAttendanceChanges: sidebarMocks.hasUnsyncedAttendance };
});

describe("Sidebar teacher workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
  });
  afterEach(() => localStorage.clear());

  test("menggunakan tiga domain kerja dan Catat sebagai action", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/attendance"]}>
        <Sidebar status={<span>Online</span>} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Hari ini" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Siswa" })).toHaveAttribute("href", "/students");
    expect(screen.getByRole("link", { name: "Kelas" })).toHaveAttribute("href", "/class");
    expect(screen.getByRole("link", { name: "Catat kelas" })).toHaveAttribute("href", "/classroom-debrief");
    expect(screen.queryByRole("link", { name: "Jadwal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Classroom Debrief" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kelas" })).toHaveAttribute("aria-current", "page");
    const footer = container.querySelector("footer");
    expect(within(footer).getByText("Online")).toBeInTheDocument();
    expect(within(footer).getByText("Guru Demo")).toBeInTheDocument();
  });

  test("menandai Siswa aktif untuk record siswa dan scores", () => {
    const first = render(<MemoryRouter initialEntries={["/students/7"]}><Sidebar /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Siswa" })).toHaveAttribute("aria-current", "page");
    first.unmount();
    render(<MemoryRouter initialEntries={["/scores/7"]}><Sidebar /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Siswa" })).toHaveAttribute("aria-current", "page");
  });

  test("indikator demo hanya bergantung pada accessMode demo yang tepat", () => {
    localStorage.setItem("access_token", unsignedTeacherToken("demo"));
    const { unmount } = render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText("Mode demo")).toBeInTheDocument();
    unmount();
    localStorage.setItem("access_token", unsignedTeacherToken("Demo"));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.queryByText("Mode demo")).not.toBeInTheDocument();
  });

  test("logout normal tetap membersihkan sesi dan data offline guru", async () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);
    await waitFor(() => expect(localStorage.getItem("access_token")).toBeNull());
    expect(sidebarMocks.hasUnsyncedAttendance).toHaveBeenCalledWith(9);
    expect(sidebarMocks.clearTeacherData).toHaveBeenCalledWith(9);
  });

  test("menampilkan kegagalan logout tanpa kehilangan sesi", async () => {
    sidebarMocks.hasUnsyncedAttendance.mockResolvedValueOnce(true);
    sidebarMocks.clearTeacherData.mockRejectedValueOnce(new Error("gagal"));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Hapus perubahan lokal dan keluar" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Data lokal belum dapat dibersihkan.");
    expect(localStorage.getItem("access_token")).toBeTruthy();
  });
});
