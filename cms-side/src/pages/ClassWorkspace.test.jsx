import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClassWorkspace from "./ClassWorkspace";

const classMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentList: vi.fn(),
  fetchClassSchedule: vi.fn(),
  students: {
    count: 2,
    page: 1,
    totalPages: 1,
    rows: [
      { id: 7, name: "Ayu", NIM: "2026071001", Class: { name: "1A" }, Attendances: [] },
      { id: 8, name: "Bima", NIM: "2026071002", Class: { name: "1A" }, Attendances: [] },
    ],
  },
  schedules: [
    { id: 10, day: "Thursday", time: "09:00", Class: { name: "1A" }, Lesson: { name: "Matematika" } },
  ],
}));

vi.mock("react-redux", () => ({
  useDispatch: () => classMocks.dispatch,
  useSelector: (selector) => selector({
    students: { students: classMocks.students },
    schedules: { schedules: classMocks.schedules },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentList: classMocks.fetchStudentList,
  fetchClassSchedule: classMocks.fetchClassSchedule,
}));

describe("Kelas workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    classMocks.fetchStudentList.mockReturnValue({ type: "students" });
    classMocks.fetchClassSchedule.mockReturnValue({ type: "schedule" });
    classMocks.dispatch.mockResolvedValue({});
  });

  test("memberi kelas konteks sendiri sebelum masuk ke kehadiran atau jadwal", async () => {
    render(<MemoryRouter><ClassWorkspace /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "1A", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("2 siswa")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Catat kehadiran/ })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Kehadiran/ })
        .some((link) => link.getAttribute("href") === "/attendance")
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Lihat minggu" })).toHaveAttribute("href", "/schedule");
    expect(screen.getByRole("link", { name: /Ayu/ })).toHaveAttribute("href", "/students/7");
    await waitFor(() => expect(classMocks.dispatch).toHaveBeenCalledTimes(2));
  });
});
