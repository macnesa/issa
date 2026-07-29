import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

const dashboardMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentList: vi.fn(),
  students: {
    count: 8,
    page: 1,
    pageSize: 7,
    totalPages: 2,
    rows: [
      {
        id: 7,
        name: "Ayu",
        Class: { name: "1A" },
        Attendances: [],
      },
    ],
  },
}));

vi.mock("react-redux", () => ({
  useDispatch: () => dashboardMocks.dispatch,
  useSelector: (selector) => selector({
    students: { students: dashboardMocks.students },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentList: dashboardMocks.fetchStudentList,
}));

vi.mock("../utils/recordDates", () => ({
  localDateValue: () => "2026-07-29",
}));

vi.mock(
  "../features/student-insights/components/TeacherAttentionQueue",
  async () => {
    const { useEffect } = await import("react");
    return {
      default: ({ onCountChange }) => {
        useEffect(() => {
          onCountChange(2);
        }, [onCountChange]);
        return null;
      },
    };
  }
);

vi.mock("../features/students/components/TableStudents", () => ({
  default: ({ data }) => (
    <tr>
      <td>{data.name}</td>
    </tr>
  ),
}));

describe("Dashboard student search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(dashboardMocks.students, {
      count: 8,
      page: 1,
      pageSize: 7,
      totalPages: 2,
      rows: [
        {
          id: 7,
          name: "Ayu",
          Class: { name: "1A" },
          Attendances: [],
        },
      ],
    });
    dashboardMocks.fetchStudentList.mockImplementation((query, page) => ({
      page,
      query,
    }));
    dashboardMocks.dispatch.mockResolvedValue(dashboardMocks.students);
  });

  function renderDashboard() {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  }

  test("searches only on submit and preserves the query for pagination", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(dashboardMocks.fetchStudentList).toHaveBeenCalledWith({}, 1);
    });

    const searchInput = screen.getByRole("searchbox", {
      name: "Cari siswa",
    });
    fireEvent.change(searchInput, { target: { value: "  Ayu  " } });

    expect(dashboardMocks.fetchStudentList).toHaveBeenCalledTimes(1);

    fireEvent.click(await screen.findByRole("button", { name: "Cari" }));

    await waitFor(() => {
      expect(dashboardMocks.fetchStudentList).toHaveBeenCalledWith(
        { name: "Ayu" },
        1
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cari" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));

    await waitFor(() => {
      expect(dashboardMocks.fetchStudentList).toHaveBeenCalledWith(
        { name: "Ayu" },
        2
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cari" })).toBeEnabled();
    });
  });

  test("keeps the disabled submit state readable while loading", () => {
    dashboardMocks.dispatch.mockImplementation(() => new Promise(() => {}));

    renderDashboard();

    expect(screen.getByRole("searchbox", { name: "Cari siswa" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mencari…" }))
      .toBeDisabled();
  });

  test("shows factual operational summary and supported routes", async () => {
    Object.assign(dashboardMocks.students, {
      count: 2,
      page: 1,
      pageSize: 7,
      totalPages: 1,
      rows: [
        {
          id: 7,
          name: "Ayu",
          Class: { name: "1A" },
          Attendances: [
            {
              attendanceDate: "2026-07-29",
              status: "Hadir",
            },
          ],
        },
        {
          id: 8,
          name: "Bima",
          Class: { name: "1A" },
          Attendances: [],
        },
      ],
    });
    dashboardMocks.dispatch.mockResolvedValue(dashboardMocks.students);

    renderDashboard();

    expect(await screen.findByText("1 dari 2 tercatat"))
      .toHaveAttribute("href", "/attendance");
    expect(await screen.findByText("2 siswa"))
      .toHaveAttribute("href", "#teacher-attention-queue-title");
    expect(screen.queryByText("Alur hari ini")).not.toBeInTheDocument();
    expect(screen.queryByText("Catat & tinjau")).not.toBeInTheDocument();
    expect(screen.queryByText("Siswa pada halaman ini"))
      .not.toBeInTheDocument();
  });
});
