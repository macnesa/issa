import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Scores from "./Scores";

const pageMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentDetail: vi.fn(),
  fetchStudentList: vi.fn(),
  student: {
    id: 7,
    name: "Ayu Pratama",
    NIM: "2026071001",
    Class: { name: "1A" },
    Scores: [],
  },
}));

vi.mock("react-redux", () => ({
  useDispatch: () => pageMocks.dispatch,
  useSelector: (selector) => selector({
    students: {
      student: pageMocks.student,
      students: {
        rows: [{ id: 17, Class: { name: "1A" } }],
      },
    },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentDetail: pageMocks.fetchStudentDetail,
  fetchStudentList: pageMocks.fetchStudentList,
}));

vi.mock("../features/scores/components/CreateScoreForm", () => ({
  default: () => <section>Form nilai</section>,
}));

vi.mock("../features/scores/components/ScoreHistory", () => ({
  default: () => <section>Riwayat nilai siswa</section>,
}));

describe("Scores student context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageMocks.fetchStudentDetail.mockReturnValue({ type: "student/detail" });
    pageMocks.fetchStudentList.mockReturnValue({ type: "student/list" });
    pageMocks.dispatch.mockResolvedValue(pageMocks.student);
  });

  test("menjaga nama, NIM, kelas, dan navigasi siswa tetap terlihat", async () => {
    render(
      <MemoryRouter initialEntries={["/scores/7"]}>
        <Routes>
          <Route path="/scores/:studentId" element={<Scores />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Nilai siswa" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ayu Pratama" }))
      .toBeInTheDocument();
    expect(screen.getByText("2026071001")).toBeInTheDocument();
    expect(screen.getByText("1A")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke detail" }))
      .toHaveAttribute("href", "/students/7");
    expect(pageMocks.fetchStudentDetail).toHaveBeenCalledWith("7");
    expect(screen.queryByText("Belum tersedia")).not.toBeInTheDocument();
  });
});
