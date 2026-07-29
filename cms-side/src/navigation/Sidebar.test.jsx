import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";
import { saveLastKnownTeacherIdentity } from "../offline-workspace/authIdentity";

const navigationCss = readFileSync(
  "src/navigation/teacher-navigation.css",
  "utf8"
);

const sidebarMocks = vi.hoisted(() => ({
  clearTeacherData: vi.fn().mockResolvedValue(undefined),
  hasUnsyncedAttendance: vi.fn().mockResolvedValue(false),
}));

function unsignedTeacherToken(accessMode) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `${encode({ alg: "none" })}.${encode({
    role: "teacher",
    teacherId: 9,
    accessMode,
  })}.`;
}

vi.mock("../offline-workspace/mutationQueue", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    clearTeacherOfflineData: sidebarMocks.clearTeacherData,
  };
});

vi.mock("../offline-workspace/attendanceOffline", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    hasUnsyncedAttendanceChanges: sidebarMocks.hasUnsyncedAttendance,
  };
});

describe("Sidebar CMS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("menggunakan istilah Indonesia dan footer faktual", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/attendance"]}>
        <Sidebar status={<span>Online</span>} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Dashboard" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Kehadiran" }))
      .toHaveAttribute("href", "/attendance");
    expect(screen.getByRole("link", { name: "Jadwal" }))
      .toHaveAttribute("href", "/schedule");
    expect(screen.queryByRole("link", { name: "Nilai" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Session index")).not.toBeInTheDocument();
    expect(screen.queryByText(/Catat perkembangan siswa/))
      .not.toBeInTheDocument();

    const activeLink = screen.getByRole("link", { name: "Kehadiran" });
    expect(activeLink).toHaveClass("is-active");
    expect(screen.getByRole("link", { name: "Dashboard" }))
      .not.toHaveClass("is-active");

    const footer = container.querySelector("footer");
    expect(within(footer).getByText("Online")).toBeInTheDocument();
    expect(within(footer).getByText("Guru Demo")).toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "Keluar" }))
      .toBeInTheDocument();
  });

  test("menggunakan token shared untuk active state tanpa override paksa", () => {
    expect(navigationCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(navigationCss).not.toContain("!important");
    expect(navigationCss).toMatch(
      /\.teacher-sidebar__nav-link\.is-active,[^}]*\{[^}]*border-left-color:\s*var\(--issa-selection\);[^}]*background:\s*var\(--issa-surface-subtle\);/s
    );
    expect(navigationCss).not.toMatch(
      /\.teacher-sidebar__nav-link\.is-active\s*\{[^}]*box-shadow:/s
    );
  });

  test("mempertahankan navigasi compact di bawah 1024px", () => {
    expect(navigationCss).toContain("@media (min-width: 1024px)");
    expect(navigationCss).toContain("@media (max-width: 1023px)");
    expect(navigationCss).not.toContain("@media (min-width: 768px)");
  });

  test("indikator demo hanya bergantung pada accessMode demo yang tepat", () => {
    localStorage.setItem("access_token", unsignedTeacherToken("demo"));
    const { unmount } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Mode demo")).toBeInTheDocument();
    unmount();

    localStorage.setItem("access_token", unsignedTeacherToken("Demo"));
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByText("Mode demo")).not.toBeInTheDocument();
  });

  test("logout normal tetap membersihkan sesi dan data offline guru", async () => {
    fireEvent.click(render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    ).getAllByRole("button", { name: "Keluar" })[0]);

    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBeNull();
    });
    expect(sidebarMocks.hasUnsyncedAttendance).toHaveBeenCalledWith(9);
    expect(sidebarMocks.clearTeacherData).toHaveBeenCalledWith(9);
  });
});
