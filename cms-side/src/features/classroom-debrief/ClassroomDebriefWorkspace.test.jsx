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
  getActiveTeacherIdentity: () => ({ id: 8, name: "Bu Sari" }),
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
  await screen.findByText("5 drafts ready for review");
}

function resolveDraftsForConfirmation() {
  const journalDraft = screen.getByText(/Nadia mencoba strategi baru/)
    .closest("article");
  fireEvent.click(within(journalDraft).getByRole("button", { name: "Discard" }));
  fireEvent.click(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }));
  fireEvent.click(screen.getByLabelText("Fraction Quiz", { selector: "input[type=radio]" }));
  fireEvent.change(screen.getByLabelText("Canonical attendance status"), { target: { value: "Hadir" } });
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
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Save edit" }));

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
      name: "Confirm 4 records",
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
    expect(await screen.findByText(/4 records saved. Review is complete/))
      .toBeInTheDocument();
    expect(screen.getAllByText("Committed")).toHaveLength(4);
  });

  test("keeps failed drafts actionable after a partial confirmation", async () => {
    workspaceMocks.confirm.mockImplementationOnce(async (items) => ({
      results: items.map((item, index) => ({
        draftId: item.draftId,
        recordType: item.recordType,
        status: index === 0 ? "failed" : "committed",
        code: index === 0 ? "confirmation_failed" : undefined,
      })),
    }));
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    resolveDraftsForConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Confirm 4 records" }));

    expect(await screen.findByText(/records saved. Failed drafts remain selected/))
      .toBeInTheDocument();
    expect(screen.getByText(/Record ini belum dapat disimpan/))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm 1 record" }))
      .toBeEnabled();

    const firstPayload = workspaceMocks.confirm.mock.calls[0][0];
    workspaceMocks.confirm.mockImplementationOnce(async (items) => committedResults(items));
    fireEvent.click(screen.getByRole("button", { name: "Confirm 1 record" }));
    await waitFor(() => expect(workspaceMocks.confirm).toHaveBeenCalledTimes(2));
    const retryPayload = workspaceMocks.confirm.mock.calls[1][0];
    expect(retryPayload).toHaveLength(1);
    expect(retryPayload[0].draftId).toBe(firstPayload[0].draftId);
    expect(retryPayload[0].clientMutationId)
      .toBe(firstPayload[0].clientMutationId);
    expect(await screen.findByText(/4 records saved. Review is complete/))
      .toBeInTheDocument();
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
    rejectGeneration(new Error("Provider secret and hostname."));
    expect(await screen.findByText(/Draf belum dapat dibuat/))
      .toBeInTheDocument();
    expect(screen.queryByText(/secret and hostname/)).not.toBeInTheDocument();
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
  });

  test("lets demo teachers generate and review but disables confirmation", async () => {
    workspaceMocks.isDemo.mockReturnValue(true);
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    expect(screen.getByText(/Demo mode can generate and review drafts/))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm 2 records" }))
      .toBeDisabled();
    expect(workspaceMocks.confirm).not.toHaveBeenCalled();
  });

  test("does not invoke AI on load, typing, or invalid whitespace", async () => {
    render(<ClassroomDebriefWorkspace />);
    await waitFor(() => expect(workspaceMocks.fetchLessons).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("What happened in class?"), {
      target: { value: "  " },
    });
    expect(workspaceMocks.generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
    expect(await screen.findByText("Tell us what happened in class."))
      .toBeInTheDocument();
    expect(workspaceMocks.generate).not.toHaveBeenCalled();
  });

  test("locks duplicate generation while preserving the note", async () => {
    let resolveGeneration;
    workspaceMocks.generate.mockImplementation(() => new Promise((resolve) => {
      resolveGeneration = resolve;
    }));
    render(<ClassroomDebriefWorkspace />);
    const note = screen.getByLabelText("What happened in class?");
    fireEvent.change(note, { target: { value: "Catatan kelas yang valid." } });
    const generateButton = screen.getByRole("button", { name: "Generate drafts" });
    fireEvent.click(generateButton);
    fireEvent.submit(generateButton.closest("form"));
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Generating drafts…" }))
      .toBeDisabled();
    resolveGeneration(debriefResponse);
    expect(await screen.findByText("5 drafts ready for review"))
      .toBeInTheDocument();
  });

  test("supports explicit edit cancel and save states", async () => {
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    const alyaDraft = screen.getByText("Alya Putri").closest("article");
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Edit" }));
    fireEvent.change(within(alyaDraft).getByLabelText("Feedback"), {
      target: { value: "Perubahan yang dibatalkan." },
    });
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Cancel edit" }));
    expect(within(alyaDraft).getByText("Alya lebih mandiri."))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByText("Ready")).toBeInTheDocument();

    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Edit" }));
    fireEvent.change(within(alyaDraft).getByLabelText("Feedback"), {
      target: { value: "Perubahan yang disimpan." },
    });
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Save edit" }));
    expect(within(alyaDraft).getByText("Perubahan yang disimpan."))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByText("Edited")).toBeInTheDocument();
  });

  test("handles an empty extraction and rate limit without clearing the note", async () => {
    workspaceMocks.generate.mockResolvedValueOnce({ drafts: [] });
    render(<ClassroomDebriefWorkspace />);
    const note = screen.getByLabelText("What happened in class?");
    fireEvent.change(note, { target: { value: "Catatan tetap tersedia." } });
    fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
    expect(await screen.findByText(/Belum ada draf yang dapat digunakan/))
      .toBeInTheDocument();
    expect(note).toHaveValue("Catatan tetap tersedia.");

    const rateError = new Error("Provider quota 12345");
    rateError.code = "publicDemoRateLimitExceeded";
    rateError.status = 429;
    rateError.retryAfterSeconds = 90;
    workspaceMocks.generate.mockRejectedValueOnce(rateError);
    fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
    expect(await screen.findByText(/sekitar 2 menit lagi/)).toBeInTheDocument();
    expect(screen.queryByText(/quota 12345/)).not.toBeInTheDocument();
    expect(note).toHaveValue("Catatan tetap tersedia.");
  });

  test("locks duplicate confirmation and moves focus to outcomes", async () => {
    let resolveConfirmation;
    workspaceMocks.confirm.mockImplementation(() => new Promise((resolve) => {
      resolveConfirmation = resolve;
    }));
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    expect(screen.getByRole("heading", { name: "5 drafts ready for review" }))
      .toHaveFocus();
    resolveDraftsForConfirmation();
    const confirmButton = screen.getByRole("button", { name: "Confirm 4 records" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    expect(workspaceMocks.confirm).toHaveBeenCalledTimes(1);
    const alyaDraft = screen.getByText("Alya Putri").closest("article");
    expect(screen.getByRole("button", { name: "Start another Debrief" }))
      .toBeDisabled();
    expect(within(alyaDraft).getByRole("button", { name: "Edit" }))
      .toBeDisabled();
    expect(within(alyaDraft).getByRole("button", { name: "Discard" }))
      .toBeDisabled();
    expect(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }))
      .toBeDisabled();
    expect(screen.getByLabelText("Canonical attendance status"))
      .toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Start another Debrief" }));
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Discard" }));
    expect(screen.getByRole("heading", { name: "5 drafts ready for review" }))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByRole("button", { name: "Discard" }))
      .toBeInTheDocument();
    resolveConfirmation(committedResults(workspaceMocks.confirm.mock.calls[0][0]));
    const success = await screen.findByText(/4 records saved. Review is complete/);
    expect(success.closest("[tabindex='-1']")).toHaveFocus();
  });

  test("uses a mobile-safe bounded workspace layout", async () => {
    const { container } = render(<ClassroomDebriefWorkspace />);
    await waitFor(() => expect(workspaceMocks.fetchLessons).toHaveBeenCalled());
    expect(container.querySelector(".classroom-debrief-workspace"))
      .toHaveClass("min-w-0");
    expect(container.querySelector("textarea")).toHaveClass("w-full");
  });
});
