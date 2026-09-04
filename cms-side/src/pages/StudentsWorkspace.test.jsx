import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

let resolveInitialRoster;

async function renderWorkspace(initialEntry = "/students") {
  const view = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/students" element={<StudentsWorkspace />} />
        <Route path="/students/:studentId" element={<StudentsWorkspace />} />
        <Route path="/scores/:studentId" element={<StudentsWorkspace initialWorkspace="assessment" />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText("Memuat siswa...")).toBeInTheDocument();
  // Commit the fetch completion and newly mounted Links' passive effects
  // together. React Router 6.8 activates navigate() in useEffect; observing
  // a Link in the DOM alone does not guarantee that effect has run.
  await act(async () => resolveInitialRoster(workspaceMocks.students));
  await waitFor(() => expect(screen.queryByText("Memuat siswa...")).not.toBeInTheDocument());
  return view;
}

describe("Students master-detail workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceMocks.fetchStudentList.mockImplementation((query, page, options) => ({ query, page, options }));
    workspaceMocks.dispatch.mockResolvedValue(workspaceMocks.students);
    workspaceMocks.dispatch.mockImplementationOnce(() => new Promise((resolve) => {
      resolveInitialRoster = resolve;
    }));
  });

  test("route Students tetap membuka roster sampai guru memilih siswa", async () => {
    await renderWorkspace();

    expect(await screen.findByRole("heading", { name: "1A", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students");
    expect(screen.getByText("Pilih siswa")).toBeInTheDocument();
    expect(screen.queryByTestId("student-record")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("Memuat siswa...")).not.toBeInTheDocument());
    const studentLink = screen.getByRole("link", { name: /Ayu/ });
    expect(studentLink).toHaveAttribute("href", "/students/7");
    expect(studentLink).toBeInTheDocument();
    await act(async () => userEvent.click(studentLink));

    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7"));
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 7 · summary");
    expect(screen.getByText("Bima")).toBeInTheDocument();
  });

  test("direct student deep-link tidak diganti dengan siswa pertama dari page roster", async () => {
    await renderWorkspace("/students/99");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/99");
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 99 · summary");
  });

  test("view aktif bertahan ketika guru berpindah siswa", async () => {
    await renderWorkspace("/students/7?view=timeline");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    fireEvent.click(await screen.findByRole("link", { name: /Bima/ }));

    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/8?view=timeline"));
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 8 · timeline");
  });


  test("search memperbarui roster tanpa mengganti siswa yang sedang dibuka", async () => {
    await renderWorkspace("/students/7?view=timeline");
    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());

    workspaceMocks.dispatch.mockResolvedValueOnce({
      ...workspaceMocks.students,
      count: 1,
      rows: [{ id: 8, name: "Bima", NIM: "2026071002", Class: { name: "1A" }, Attendances: [] }],
    });
    await screen.findByRole("link", { name: /Bima/ });
    fireEvent.change(screen.getByRole("searchbox", { name: "Cari siswa" }), { target: { value: "Bima" } });
    fireEvent.click(screen.getByRole("button", { name: "Cari siswa" }));

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText("Memuat siswa...")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline");
  });

  test("perubahan view masuk history browser dan mobile back mempertahankan view", async () => {
    await renderWorkspace("/students/7");
    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Buka Perjalanan test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline"));

    fireEvent.click(screen.getByRole("button", { name: "Browser Back test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7"));

    fireEvent.click(screen.getByRole("button", { name: "Buka Perjalanan test" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/7?view=timeline"));
    fireEvent.click(screen.getByRole("button", { name: "Siswa" }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students?view=timeline"));
    fireEvent.click(await screen.findByRole("link", { name: /Bima/ }));
    await waitFor(() => expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/students/8?view=timeline"));
  });
  test("score deep-link membuka record yang sama langsung pada Penilaian", async () => {
    await renderWorkspace("/scores/8");

    await waitFor(() => expect(workspaceMocks.dispatch).toHaveBeenCalled());
    expect(screen.getByLabelText("Lokasi aktif")).toHaveTextContent("/scores/8");
    expect(screen.getByTestId("student-record")).toHaveTextContent("Record 8 · assessment");
  });
});
