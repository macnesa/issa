import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Attendance from "./Attendance";

const attendancePageMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentList: vi.fn(),
  students: {
    rows: [{ id: 7, name: "Ayu", Attendances: [] }],
    totalPages: 1,
  },
}));

vi.mock("react-redux", () => ({
  useDispatch: () => attendancePageMocks.dispatch,
  useSelector: (selector) => selector({
    students: { students: attendancePageMocks.students },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentList: attendancePageMocks.fetchStudentList,
}));

vi.mock("../utils/recordDates", async () => {
  const actual = await vi.importActual("../utils/recordDates");
  return {
    ...actual,
    localDateValue: () => "2026-07-29",
  };
});

vi.mock("../features/attendance/components/TableAttendance", () => ({
  default: ({ data, attendanceDate }) => (
    <tr>
      <td>{data.name}</td>
      <td>{attendanceDate}</td>
    </tr>
  ),
}));

describe("Attendance route states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    attendancePageMocks.students.rows = [{
      id: 7,
      name: "Ayu",
      Attendances: [],
    }];
    attendancePageMocks.students.totalPages = 1;
    attendancePageMocks.fetchStudentList.mockImplementation((query) => ({
      query,
      type: "student/list",
    }));
    attendancePageMocks.dispatch.mockResolvedValue(undefined);
  });

  test("renders the scoped ledger and preserves student search", async () => {
    render(<Attendance />);

    expect(await screen.findByRole("heading", {
      name: "Kehadiran kelas",
    })).toBeInTheDocument();
    expect(await screen.findByText("Ayu")).toBeInTheDocument();
    expect(screen.getByText("2026-07-29")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Cari siswa" }), {
      target: { value: "Ayu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari" }));

    await waitFor(() => {
      expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith({
        name: "Ayu",
      });
    });
  });

  test("renders an empty state when the authorized class has no rows", async () => {
    attendancePageMocks.students.rows = [];
    render(<Attendance />);

    expect(await screen.findByText("Belum ada siswa")).toBeInTheDocument();
  });

  test("renders a factual error and retries the same query", async () => {
    attendancePageMocks.dispatch
      .mockRejectedValueOnce(new Error("Jaringan terputus"))
      .mockResolvedValueOnce(undefined);
    render(<Attendance />);

    expect(await screen.findByText("Jaringan terputus")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() => {
      expect(attendancePageMocks.dispatch).toHaveBeenCalledTimes(2);
    });
  });
});
