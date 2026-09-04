import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import StudentsWorkspace from "./StudentsWorkspace";

const workspaceMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentList: vi.fn(),
  students: {
    count: 2,
    page: 1,
    pageSize: 7,
    totalPages: 1,
    rows: [
      { id: 7, name: "Ayu", NIM: "2026071001", Class: { name: "1A" }, Attendances: [] },
      { id: 8, name: "Bima", NIM: "2026071002", Class: { name: "1A" }, Attendances: [] },
    ],
  },
}));

vi.mock("react-redux", () => ({
  useDispatch: () => workspaceMocks.dispatch,
  useSelector: (selector) => selector({ students: { students: workspaceMocks.students } }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentList: workspaceMocks.fetchStudentList,
}));

vi.mock("./AddStudent", () => ({
  default: ({ studentIdOverride, initialWorkspace, activeWorkspaceOverride, onWorkspaceChange }) => (
    <div data-testid="student-record">
      Record {studentIdOverride} · {activeWorkspaceOverride || initialWorkspace}
      <button type="button" onClick={() => onWorkspaceChange?.("timeline")}>Buka Perjalanan test</button>
    </div>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Lokasi aktif">{location.pathname}{location.search}</output>
      <button type="button" onClick={() => navigate(-1)}>Browser Back test</button>
    </>
  );
}

function renderWorkspace(initialEntry = "/students") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/students" element={<StudentsWorkspace />} />
        <Route path="/students/:studentId" element={<StudentsWorkspace />} />
        <Route path="/scores/:studentId" element={<StudentsWorkspace initialWorkspace="assessment" />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Students master-detail workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceMocks.fetchStudentList.mockImplementation((query, page, options) => ({ query, page, options }));
    workspaceMocks.dispatch.mockResolvedValue(workspaceMocks.students);
  });

  test("route Students tetap membuka roster sampai guru memilih siswa", async () => {
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "1A", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students");
    expect(screen.getByText("Pilih siswa")).toBeInTheDocument();
    expect(screen.queryByTestId("student-record")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Ayu/ }));

    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7"));
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 7 · summary");
    expect(screen.getByText("Bima")).toBeInTheDocument();
  });

  test("direct student deep-link tidak diganti dengan siswa pertama dari page roster", async () => {
    renderWorkspace("/students/99");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/99");
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 99 · summary");
  });

  test("view aktif bertahan ketika guru berpindah siswa", async () => {
    renderWorkspace("/students/7?view=timeline");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("link", { name: /Bima/ }));

    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/8?view=timeline"));
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 8 · timeline");
  });


  test("search memperbarui roster tanpa mengganti siswa yang sedang dibuka", async () => {
    renderWorkspace("/students/7?view=timeline");
    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());

    workspaceMocks.dispatch.mockResolvedValueOnce({
      ...workspaceMocks.students,
      count: 1,
      rows: [{ id: 8, name: "Bima", NIM: "2026071002", Class: { name: "1A" }, Attendances: [] }],
    });
    fireEvent.change(screen.getByLabelText("Cari siswa"), { target: { value: "Bima" } });
    fireEvent.click(screen.getByRole("button", { name: "Cari siswa" }));

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline");
  });

  test("perubahan view masuk history browser dan mobile back mempertahankan view", async () => {
    renderWorkspace("/students/7");
    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Buka Perjalanan test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline"));

    fireEvent.click(screen.getByRole("button", { name: "Browser Back test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7"));

    fireEvent.click(screen.getByRole("button", { name: "Buka Perjalanan test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline"));
    fireEvent.click(screen.getByRole("button", { name: "Siswa" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students?view=timeline"));
    fireEvent.click(screen.getByRole("link", { name: /Bima/ }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/8?view=timeline"));
  });
  test("score deep-link membuka record yang sama langsung pada Penilaian", async () => {
    renderWorkspace("/scores/8");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/scores/8");
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 8 · assessment");
  });
});
