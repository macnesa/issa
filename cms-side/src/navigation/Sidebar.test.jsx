import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
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

  test("menghapus active state kuning dan shadow dekoratif", () => {
    expect(navigationCss).not.toContain("#f2e291");
    expect(navigationCss).toMatch(
      /\.teacher-sidebar__nav-link\.is-active\s*\{[^}]*border-left-color:\s*#6bbfbc;[^}]*background:\s*#dce9e9;/s
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
});
