import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ClassroomDebriefWorkspace from "./ClassroomDebriefWorkspace";

const workspaceMocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  fetchLessons: vi.fn(),
  generate: vi.fn(),
  isDemo: vi.fn(),
}));

vi.mock("./classroomDebriefApi", () => ({
  confirmClassroomDebriefDrafts: workspaceMocks.confirm,
  fetchDebriefLessons: workspaceMocks.fetchLessons,
  generateClassroomDebriefDrafts: workspaceMocks.generate,
}));

vi.mock("../../offline-workspace/authIdentity", () => ({
  isTeacherDemoSession: workspaceMocks.isDemo,
}));

const debriefResponse = {
  drafts: [
    {
      draftId: "debrief-draft-1",
      type: "feedback",
      state: "ready",
      sourceExcerpt: "Alya lebih mandiri hari ini",
      studentReference: "Alya",
      studentResolution: {
        status: "resolved",
        student: { studentId: 1, name: "Alya Putri" },
        candidates: [],
      },
      payload: { feedback: "Alya lebih mandiri." },
      clarificationReasons: [],
      context: { class: { id: 7, name: "6A" }, lesson: null, assessmentResolution: null },
    },
    {
      draftId: "debrief-draft-2",
      type: "journal",
      state: "ready",
      sourceExcerpt: "Nadia mencoba strategi baru",
      studentReference: "Nadia",
      studentResolution: {
        status: "resolved",
        student: { studentId: 3, name: "Nadia Sari" },
        candidates: [],
      },
      payload: { content: "Mencoba strategi baru.", type: "observation", voiceCaptureType: null },
      clarificationReasons: [],
      context: { class: { id: 7, name: "6A" }, lesson: null, assessmentResolution: null },
    },
    {
      draftId: "debrief-draft-3",
      type: "feedback",
      state: "needs_clarification",
      sourceExcerpt: "Rafi aktif berdiskusi",
      studentReference: "Rafi",
      studentResolution: {
        status: "ambiguous",
        student: null,
        candidates: [
          { studentId: 2, name: "Rafi Ahmad" },
          { studentId: 4, name: "Rafi Pratama" },
        ],
      },
      payload: { feedback: "Aktif berdiskusi." },
      clarificationReasons: ["student_ambiguous"],
      context: { class: { id: 7, name: "6A" }, lesson: null, assessmentResolution: null },
    },
    {
      draftId: "debrief-draft-4",
      type: "score",
      state: "needs_clarification",
      sourceExcerpt: "Nadia mendapat 82 pada quiz",
      studentReference: "Nadia",
      studentResolution: {
        status: "resolved",
        student: { studentId: 3, name: "Nadia Sari" },
        candidates: [],
      },
      payload: { value: 82, LessonId: 5, AssignmentId: null },
      clarificationReasons: ["assessment_ambiguous"],
      context: {
        class: { id: 7, name: "6A" },
        lesson: { id: 5, name: "Matematika" },
        assessmentResolution: {
          status: "ambiguous",
          assignment: null,
          candidates: [
            { assignmentId: 9, name: "Fraction Quiz", type: "quiz" },
            { assignmentId: 10, name: "Weekly Exercise", type: "exercise" },
          ],
        },
      },
    },
    {
      draftId: "debrief-draft-5",
      type: "attendance",
      state: "needs_clarification",
      sourceExcerpt: "Rafi terlambat 10 menit",
      studentReference: "Rafi",
      studentResolution: {
        status: "resolved",
        student: { studentId: 2, name: "Rafi Ahmad" },
        candidates: [],
      },
      payload: { reportedStatus: "late", status: null, minutesLate: 10 },
      clarificationReasons: ["attendance_status_not_supported"],
      context: { class: { id: 7, name: "6A" }, lesson: null, assessmentResolution: null },
    },
  ],
};

function committedResults(items) {
  return {
    results: items.map((item, index) => ({
      clientMutationId: item.clientMutationId,
      draftId: item.draftId,
      recordId: 100 + index,
      recordType: item.recordType,
      status: "committed",
    })),
  };
}

async function generateDrafts() {
  fireEvent.change(screen.getByLabelText("What happened in class?"), {
    target: { value: "Alya mandiri dan Rafi aktif berdiskusi." },
  });
  fireEvent.change(screen.getByLabelText("Lesson context (optional)"), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
  await screen.findByText("5 drafts");
}

describe("Classroom Debrief workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceMocks.isDemo.mockReturnValue(false);
    workspaceMocks.fetchLessons.mockResolvedValue([
      { id: 5, name: "Matematika" },
    ]);
    workspaceMocks.generate.mockResolvedValue(debriefResponse);
    workspaceMocks.confirm.mockImplementation(async (items) => (
      committedResults(items)
    ));
  });

  test("generates once, reviews sources, edits, discards, resolves, and confirms", async () => {
    render(<ClassroomDebriefWorkspace />);
    await waitFor(() => expect(workspaceMocks.fetchLessons).toHaveBeenCalled());
    await generateDrafts();

    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
    expect(workspaceMocks.generate).toHaveBeenCalledWith({
      lessonId: "5",
      text: "Alya mandiri dan Rafi aktif berdiskusi.",
    });
    expect(screen.getByText("“Alya lebih mandiri hari ini”"))
      .toBeInTheDocument();

    const alyaDraft = screen.getByText("Alya Putri").closest("article");
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Edit" }));
    fireEvent.change(within(alyaDraft).getByLabelText("Feedback"), {
      target: { value: "Alya menyelesaikan tugas secara mandiri." },
    });
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Finish editing" }));

    const nadiaJournal = screen.getByText(/Nadia mencoba strategi baru/)
      .closest("article");
    fireEvent.click(within(nadiaJournal).getByRole("button", { name: "Discard" }));

    fireEvent.click(screen.getByLabelText("Rafi Ahmad", {
      selector: "input[type=radio]",
    }));
    fireEvent.click(screen.getByLabelText("Fraction Quiz", {
      selector: "input[type=radio]",
    }));
    fireEvent.change(screen.getByLabelText("Canonical attendance status"), {
      target: { value: "Hadir" },
    });

    expect(screen.getByText(/4 ready · 0 needs clarification · 1 discarded/))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "Confirm selected drafts",
    }));

    await waitFor(() => expect(workspaceMocks.confirm).toHaveBeenCalledTimes(1));
    const confirmationItems = workspaceMocks.confirm.mock.calls[0][0];
    expect(confirmationItems).toHaveLength(4);
    expect(confirmationItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        recordType: "feedback",
        payload: expect.objectContaining({
          content: "Alya menyelesaikan tugas secara mandiri.",
        }),
      }),
      expect.objectContaining({ studentId: 2 }),
      expect.objectContaining({
        recordType: "score",
        payload: expect.objectContaining({ assignmentId: 9, value: 82 }),
      }),
      expect.objectContaining({
        recordType: "attendance",
        payload: expect.objectContaining({ status: "Hadir" }),
      }),
    ]));
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("4 records saved. Review is complete."))
      .toBeInTheDocument();
  });

  test("keeps failed drafts actionable after a partial confirmation", async () => {
    workspaceMocks.confirm.mockImplementation(async (items) => ({
      results: items.map((item, index) => ({
        draftId: item.draftId,
        recordType: item.recordType,
        status: index === 0 ? "failed" : "committed",
        code: index === 0 ? "confirmation_failed" : undefined,
      })),
    }));
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    const journalDraft = screen.getByText(/Nadia mencoba strategi baru/)
      .closest("article");
    fireEvent.click(within(journalDraft).getByRole("button", {
      name: "Discard",
    }));
    fireEvent.click(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }));
    fireEvent.click(screen.getByLabelText("Fraction Quiz", { selector: "input[type=radio]" }));
    fireEvent.change(screen.getByLabelText("Canonical attendance status"), { target: { value: "Hadir" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected drafts" }));

    expect(await screen.findByText(/records saved. Failed drafts remain selected/))
      .toBeInTheDocument();
    expect(screen.getByText("Save failed: confirmation_failed"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm selected drafts" }))
      .toBeEnabled();
  });

  test("shows loading and extraction errors without a second request", async () => {
    let rejectGeneration;
    workspaceMocks.generate.mockImplementation(() => new Promise((resolve, reject) => {
      rejectGeneration = reject;
    }));
    render(<ClassroomDebriefWorkspace />);
    fireEvent.change(screen.getByLabelText("What happened in class?"), {
      target: { value: "Catatan kelas yang valid." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
    expect(screen.getByRole("button", { name: "Generating drafts…" }))
      .toBeDisabled();
    rejectGeneration(new Error("Provider sedang tidak tersedia."));
    expect(await screen.findByText("Provider sedang tidak tersedia."))
      .toBeInTheDocument();
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
  });

  test("lets demo teachers generate and review but disables confirmation", async () => {
    workspaceMocks.isDemo.mockReturnValue(true);
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    expect(screen.getByText(/Demo mode can generate and review drafts/))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm selected drafts" }))
      .toBeDisabled();
    expect(workspaceMocks.confirm).not.toHaveBeenCalled();
  });

  test("uses a mobile-safe bounded workspace layout", async () => {
    const { container } = render(<ClassroomDebriefWorkspace />);
    await waitFor(() => expect(workspaceMocks.fetchLessons).toHaveBeenCalled());
    expect(container.querySelector(".classroom-debrief-workspace"))
      .toHaveClass("min-w-0");
    expect(container.querySelector("textarea")).toHaveClass("w-full");
  });
});
