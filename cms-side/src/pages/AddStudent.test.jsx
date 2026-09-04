import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StudentDetail from "./AddStudent";

const studentDetailMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchStudentDetail: vi.fn(),
  fetchStudentList: vi.fn(),
  isDemo: false,
  loadWorkspace: vi.fn(),
  storeStudentDetail: vi.fn(),
  updateStudentRecord: vi.fn(),
  student: {
    id: 7,
    name: "Ayu Pratama",
    NIM: "2026071001",
    Class: { name: "1A" },
    Attendances: [{
      id: 21,
      StudentId: 7,
      attendanceDate: "2026-07-29",
      recordedAt: "2026-07-29T08:00:00.000Z",
      status: "Hadir",
    }],
    Scores: [{
      id: 31,
      value: 88,
      status: true,
      recordedAt: "2026-07-29T08:00:00.000Z",
      Lesson: { name: "Matematika", KKM: 75 },
      Assignment: { name: "Ulangan harian" },
    }],
  },
}));

const defaultStudentDetail = studentDetailMocks.student;

vi.mock("react-redux", () => ({
  useDispatch: () => studentDetailMocks.dispatch,
  useSelector: (selector) => selector({
    students: {
      student: studentDetailMocks.student,
      students: { rows: [] },
    },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchStudentDetail: studentDetailMocks.fetchStudentDetail,
  fetchStudentList: studentDetailMocks.fetchStudentList,
  storeStudentDetail: studentDetailMocks.storeStudentDetail,
  updateStudentRecord: studentDetailMocks.updateStudentRecord,
}));

vi.mock("../offline-workspace/OfflineWorkspaceProvider", () => ({
  useOfflineWorkspace: () => ({
    isDemo: studentDetailMocks.isDemo,
    teacherIdentity: { id: 9, name: "Guru" },
    onlineHint: true,
  }),
}));

vi.mock("../offline-workspace/studentDetailSnapshot", () => ({
  loadStudentDetailWorkspace: studentDetailMocks.loadWorkspace,
}));

vi.mock("../offline-workspace/workspaceSnapshots", () => ({
  mergeWorkspaceSnapshot: vi.fn().mockResolvedValue(null),
}));

vi.mock("../offline-workspace/attendanceOffline", () => ({
  useAttendanceOfflineRecords: ({ serverRecords }) => ({
    records: serverRecords.map((record) => ({
      ...record,
      entityKey: `attendance:${record.StudentId}:${record.attendanceDate}`,
    })),
    message: "",
    savingEntityKey: null,
    updateAttendance: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../features/student-learning-journal/components/StudentLearningJournalSection", () => ({
  default: () => <div>Jurnal siswa</div>,
}));

vi.mock("../features/student-evidence/components/StudentEvidenceSection", () => ({
  default: () => <div>Bukti siswa</div>,
}));

vi.mock("../features/feedback/components/FeedbackForm", () => ({
  default: ({ isDemo }) => (
    <div>Form feedback {isDemo ? "read-only" : "editable"}</div>
  ),
}));

vi.mock("../features/feedback/components/FeedbackHistory", () => ({
  default: () => <div>Histori feedback</div>,
}));

vi.mock("../features/scores/components/CreateScoreForm", () => ({
  default: () => <div>Score form</div>,
}));

vi.mock("../features/scores/components/ScoreHistory", () => ({
  default: ({ scores }) => <div>Score history {scores?.[0]?.Lesson?.name}</div>,
}));

vi.mock("../features/ai-learning-narrative/AiNarrativeWorkspace", () => ({
  default: () => null,
}));

function response(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function renderStudentDetail() {
  return render(
    <MemoryRouter initialEntries={["/students/7"]}>
      <Routes>
        <Route path="/students/:studentId" element={<StudentDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Student Detail Fieldwork workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentDetailMocks.student = defaultStudentDetail;
    studentDetailMocks.isDemo = false;
    studentDetailMocks.fetchStudentDetail.mockReturnValue({ type: "student/detail" });
    studentDetailMocks.fetchStudentList.mockReturnValue({ type: "student/list" });
    studentDetailMocks.storeStudentDetail.mockReturnValue({ type: "student/store" });
    studentDetailMocks.dispatch.mockResolvedValue(studentDetailMocks.student);
    studentDetailMocks.loadWorkspace.mockResolvedValue({
      student: studentDetailMocks.student,
      snapshot: { journalEntries: [] },
      source: "remote",
    });
    vi.stubGlobal("fetch", vi.fn(() => response([])));
  });

  afterEach(() => vi.unstubAllGlobals());

  test("menggunakan Ringkasan, Perjalanan, dan Penilaian sebagai tiga konteks record", async () => {
    renderStudentDetail();

    expect(await screen.findByRole("heading", { name: "Ayu Pratama", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("2026071001")).toHaveClass("issa-no-wrap");
    expect(screen.getByText("1A")).toBeInTheDocument();

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "student-workspace-summary");

    fireEvent.click(screen.getByRole("tab", { name: "Perjalanan" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "student-workspace-timeline");
    expect(screen.getByText("Matematika: 88")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Kehadiran" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kelola di Kelas" })).toHaveAttribute(
      "href",
      "/attendance?studentId=7&name=Ayu+Pratama&date=2026-07-29"
    );

    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    fireEvent.click(screen.getByRole("button", { name: /^Catatan Catat observasi/ }));
    expect(screen.getByText("Jurnal siswa")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    fireEvent.click(screen.getByRole("button", { name: /^Bukti Tambahkan/ }));
    expect(screen.getByText("Bukti siswa")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    fireEvent.click(screen.getByRole("button", { name: /^Feedback Tulis/ }));
    expect(screen.getByText("Form feedback editable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Penilaian" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "student-workspace-assessment");
    expect(screen.getByText(/Score history Matematika/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Catat nilai" }));
    expect(screen.getByText("Score form")).toBeInTheDocument();
  });

  test("proyeksi student yang tidak menyertakan histori tidak diklaim sebagai empty", async () => {
    studentDetailMocks.student = {
      id: 7,
      name: "Ayu Pratama",
      NIM: "2026071001",
      Class: { name: "1A" },
    };
    studentDetailMocks.loadWorkspace.mockResolvedValue({
      student: studentDetailMocks.student,
      snapshot: null,
      source: "remote",
    });

    renderStudentDetail();

    expect(await screen.findByText("Histori kehadiran tidak tersedia")).toBeInTheDocument();
    expect(
      screen.getByText("Detail siswa ini tidak menyertakan proyeksi penilaian.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Belum ada nilai")).not.toBeInTheDocument();
  });

  test("mode demo tetap membaca record tetapi mengunci editor mutasi", async () => {
    studentDetailMocks.isDemo = true;
    renderStudentDetail();

    await screen.findByRole("heading", { name: "Ayu Pratama" });
    fireEvent.click(screen.getByRole("tab", { name: "Perjalanan" }));
    expect(screen.queryByRole("button", { name: "Kehadiran" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    fireEvent.click(screen.getByRole("button", { name: /^Feedback Tulis/ }));
    expect(screen.getByText("Form feedback read-only")).toBeInTheDocument();
    expect(studentDetailMocks.updateStudentRecord).not.toHaveBeenCalled();
  });

  test("keyboard tab berpindah dari Ringkasan ke Perjalanan", async () => {
    renderStudentDetail();
    const overview = await screen.findByRole("tab", { name: "Ringkasan" });
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Perjalanan" })).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "student-workspace-timeline");
  });
});
