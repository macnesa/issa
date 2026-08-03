import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TeacherLayout from "./TeacherLayout";

const layoutSource = readFileSync("src/layouts/TeacherLayout.jsx", "utf8");
const sidebarSource = readFileSync("src/navigation/Sidebar.jsx", "utf8");

vi.mock("../navigation/Sidebar", () => ({
  default: ({ status }) => (
    <aside>
      <footer aria-label="Footer sesi">{status}</footer>
    </aside>
  ),
}));

vi.mock("../offline-workspace/OfflineStatusIndicator", () => ({
  default: () => <span>Online</span>,
}));

vi.mock("../features/teacher-search/TeacherCommandPalette", () => ({
  default: () => null,
}));

describe("TeacherLayout", () => {
  test("menempatkan status faktual di footer shell dan mempertahankan konten route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<TeacherLayout />}>
            <Route index element={<p>Konten halaman</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const footer = screen.getByRole("contentinfo", {
      name: "Footer sesi",
    });
    expect(within(footer).getByText("Online")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Buka pencarian universal",
    })).toBeInTheDocument();
    expect(screen.getByRole("link", {
      name: "Lewati ke konten utama",
    })).toHaveAttribute("href", "#cms-main-content");
    expect(screen.getByText("Konten halaman")).toBeInTheDocument();
  });

  test("mengaktifkan sidebar desktop hanya mulai 1024px", () => {
    expect(layoutSource).toContain("lg:grid");
    expect(sidebarSource).toContain("lg:sticky");
    expect(layoutSource).toContain("max-lg:");
    expect(layoutSource).not.toContain("md:grid");
  });
});
