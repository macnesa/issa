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

vi.mock("../features/attendance/components/AttendanceRecordEditor", () => ({
  default: ({ readOnly }) => (
    <div data-testid="attendance-editor">
      Attendance editor {readOnly ? "read-only" : "editable"}
    </div>
  ),
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

describe("Student Detail institutional workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentDetailMocks.isDemo = false;
    studentDetailMocks.fetchStudentDetail.mockReturnValue({
      type: "student/detail",
    });
    studentDetailMocks.fetchStudentList.mockReturnValue({
      type: "student/list",
    });
    studentDetailMocks.storeStudentDetail.mockReturnValue({
      type: "student/store",
    });
    studentDetailMocks.dispatch.mockResolvedValue(
      studentDetailMocks.student
    );
    studentDetailMocks.loadWorkspace.mockResolvedValue({
      student: studentDetailMocks.student,
      snapshot: { journalEntries: [] },
      source: "remote",
    });
    vi.stubGlobal("fetch", vi.fn(() => response([])));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("menampilkan identitas faktual dan kelima tab yang dapat dipindahkan", async () => {
    renderStudentDetail();

    expect(await screen.findByRole("heading", {
      name: "Ayu Pratama",
      level: 1,
    })).toBeInTheDocument();
    expect(screen.getByText("2026071001")).toHaveClass("issa-no-wrap");
    expect(screen.getByText("1A")).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-summary"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Kehadiran" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-attendance"
    );
    expect(screen.getByTestId("attendance-editor")).toHaveTextContent(
      "editable"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Nilai" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-scores"
    );
    expect(screen.getByText("Matematika")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Jurnal & Bukti" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-journal-evidence"
    );
    expect(screen.getByText("Jurnal siswa")).toBeInTheDocument();
    expect(screen.getByText("Bukti siswa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Feedback" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-feedback"
    );
    expect(screen.getByText("Form feedback editable")).toBeInTheDocument();
  });

  test("mode demo tetap membaca record tetapi mengunci editor mutasi", async () => {
    studentDetailMocks.isDemo = true;
    renderStudentDetail();

    await screen.findByRole("heading", { name: "Ayu Pratama" });
    fireEvent.click(screen.getByRole("tab", { name: "Kehadiran" }));
    expect(screen.getByTestId("attendance-editor")).toHaveTextContent(
      "read-only"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Feedback" }));
    expect(screen.getByText("Form feedback read-only")).toBeInTheDocument();
    expect(studentDetailMocks.updateStudentRecord).not.toHaveBeenCalled();
  });

  test("keyboard tab berpindah ke workspace berikutnya", async () => {
    renderStudentDetail();
    const summary = await screen.findByRole("tab", { name: "Ringkasan" });

    fireEvent.keyDown(summary, { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Kehadiran" }))
        .toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "student-workspace-attendance"
    );
  });
});
