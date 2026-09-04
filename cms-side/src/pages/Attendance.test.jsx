import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Attendance from "./Attendance";

const attendancePageMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentList: vi.fn(),
  paginationProps: null,
  tableProps: null,
  students: {
    count: 14,
    page: 1,
    pageSize: 7,
    rows: [{ id: 7, name: "Ayu", Attendances: [] }],
    totalPages: 2,
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
  default: (props) => {
    attendancePageMocks.tableProps = props;
    return (
      <tr>
        <td>{props.data.name}</td>
        <td>{props.attendanceDate}</td>
      </tr>
    );
  },
}));

vi.mock("../features/students/components/Pagination", () => ({
  default: (props) => {
    attendancePageMocks.paginationProps = props;
    return (
      <button type="button" onClick={() => props.onPageChange(2)}>
        Halaman berikutnya
      </button>
    );
  },
}));

describe("Attendance route states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    attendancePageMocks.paginationProps = null;
    attendancePageMocks.tableProps = null;
    Object.assign(attendancePageMocks.students, {
      count: 14,
      page: 1,
      pageSize: 7,
      rows: [{
        id: 7,
        name: "Ayu",
        Attendances: [],
      }],
      totalPages: 2,
    });
    attendancePageMocks.fetchStudentList.mockImplementation((query, page, options) => ({
      options,
      page,
      query,
      type: "student/list",
    }));
    attendancePageMocks.dispatch.mockResolvedValue(attendancePageMocks.students);
  });

  test("preserves the applied search while moving between pages", async () => {
    render(<MemoryRouter initialEntries={["/attendance"]}><Attendance /></MemoryRouter>);

    expect(await screen.findByRole("heading", {
      name: "Kehadiran",
    })).toBeInTheDocument();
    expect(await screen.findByText("Ayu")).toBeInTheDocument();
    expect(screen.getByText("2026-07-29")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Cari siswa" }), {
      target: { value: "  Ayu  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari" }));

    await waitFor(() => {
      expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith(
        { name: "Ayu" },
        1,
        expect.objectContaining({ signal: expect.anything(), requestKey: "attendance-student-list" })
      );
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Cari" })).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));

    await waitFor(() => {
      expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith(
        { name: "Ayu" },
        2,
        expect.objectContaining({ signal: expect.anything(), requestKey: "attendance-student-list" })
      );
    });
  });


  test("shortcut dari Siswa mempertahankan fokus pada record yang sama", async () => {
    render(<MemoryRouter initialEntries={["/attendance?studentId=7&name=Ayu"]}><Attendance /></MemoryRouter>);

    expect(await screen.findByText("Ayu")).toBeInTheDocument();
    await waitFor(() => {
      expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith(
        { name: "Ayu" },
        1,
        expect.objectContaining({ signal: expect.anything(), requestKey: "attendance-student-list" })
      );
    });
    expect(attendancePageMocks.tableProps.focused).toBe(true);
  });

  test("refreshes the current filtered page after a row saves attendance", async () => {
    Object.assign(attendancePageMocks.students, { page: 2 });
    render(<MemoryRouter initialEntries={["/attendance"]}><Attendance /></MemoryRouter>);

    await screen.findByText("Ayu");
    fireEvent.change(screen.getByRole("searchbox", { name: "Cari siswa" }), {
      target: { value: "Ayu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cari" })).toBeEnabled());

    Object.assign(attendancePageMocks.students, { page: 2 });
    await attendancePageMocks.tableProps.onAttendanceSaved();

    expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith(
      { name: "Ayu" },
      2,
      expect.objectContaining({ signal: expect.anything(), requestKey: "attendance-student-list" })
    );
  });

  test("renders an empty state when the authorized class has no rows", async () => {
    attendancePageMocks.students.rows = [];
    attendancePageMocks.students.totalPages = 1;
    render(<MemoryRouter initialEntries={["/attendance"]}><Attendance /></MemoryRouter>);

    expect(await screen.findByText("Belum ada siswa")).toBeInTheDocument();
  });

  test("renders a factual error and retries the same applied query", async () => {
    attendancePageMocks.dispatch
      .mockRejectedValueOnce(new Error("Jaringan terputus"))
      .mockResolvedValueOnce(attendancePageMocks.students);
    render(<MemoryRouter initialEntries={["/attendance"]}><Attendance /></MemoryRouter>);

    expect(await screen.findByText("Jaringan terputus")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() => {
      expect(attendancePageMocks.dispatch).toHaveBeenCalledTimes(2);
    });
    expect(attendancePageMocks.fetchStudentList).toHaveBeenLastCalledWith(
      { name: "" },
      1,
      expect.objectContaining({ signal: expect.anything(), requestKey: "attendance-student-list" })
    );
  });
});
