import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

vi.mock("../utils/recordDates", () => ({ localDateValue: () => "2026-07-29" }));
vi.mock("../offline-workspace/authIdentity", () => ({ getActiveTeacherIdentity: () => ({ id: 9, name: "Bu Rani" }) }));
vi.mock("../features/student-insights/components/TeacherAttentionQueue", () => ({
  default: () => <section><h2>Perlu ditinjau</h2></section>,
}));

function apiResponse(data, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(data) });
}

describe("Hari ini workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (String(url).includes("/students")) {
        return apiResponse({
          count: 2,
          page: 1,
          totalPages: 1,
          rows: [
            { id: 7, name: "Ayu", Class: { name: "1A" }, Attendances: [{ attendanceDate: "2026-07-29", status: "Hadir" }] },
            { id: 8, name: "Bima", Class: { name: "1A" }, Attendances: [] },
          ],
        });
      }
      if (String(url).includes("/schedules")) return apiResponse([]);
      return apiResponse([]);
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  test("memusatkan pekerjaan yang belum selesai tanpa mengulang dashboard KPI", async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    expect(await screen.findByRole("link", { name: "1A" })).toHaveAttribute("href", "/class");
    expect(screen.getByText("1 dari 2 siswa sudah dicatat")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kehadiran" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lengkapi kehadiran hari ini/ })).toHaveAttribute("href", "/attendance");
    expect(screen.getByRole("heading", { name: "Jadwal hari ini" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat minggu" })).toHaveAttribute("href", "/schedule");
    expect(screen.getByRole("link", { name: /Catat kelas/ })).toHaveAttribute("href", "/classroom-debrief");
    expect(screen.queryByRole("link", { name: "Siswa" })).not.toBeInTheDocument();
    expect(screen.queryByText("Perlu ditinjau", { selector: "dt" })).not.toBeInTheDocument();
  });

  test("menampilkan error faktual dari sumber konteks", async () => {
    fetch.mockImplementationOnce(() => apiResponse({ msg: "Jaringan terputus" }, false));
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(await screen.findByText("Jaringan terputus")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});
