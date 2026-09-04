import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClassroomDebriefWorkspace, { confirmationItem, draftReady, editableDraft } from "./ClassroomDebriefWorkspace";

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
  fireEvent.change(screen.getByLabelText("Apa yang terjadi di kelas?"), {
    target: { value: "Alya mandiri dan Rafi aktif berdiskusi." },
  });
  fireEvent.click(screen.getByLabelText("Konteks pelajaran (opsional)"));
  fireEvent.click(await screen.findByRole("option", { name: "Matematika" }));
  fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
  await screen.findByText("5 draf siap ditinjau");
}

async function chooseOption(label, option) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

async function resolveDraftsForConfirmation() {
  const journalDraft = screen.getByText(/Nadia mencoba strategi baru/)
    .closest("article");
  fireEvent.click(within(journalDraft).getByRole("button", { name: "Buang" }));
  fireEvent.click(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }));
  fireEvent.click(screen.getByLabelText("Fraction Quiz", { selector: "input[type=radio]" }));
  await chooseOption("Status kehadiran", "Hadir");
}

describe("Classroom Debrief workspace", () => {
  test("treats an empty score draft as unresolved instead of zero", () => {
    const sourceDraft = debriefResponse.drafts.find((draft) => draft.type === "score");
    const draft = editableDraft(sourceDraft);
    const resolvedDraft = {
      ...draft,
      selectedAssignmentId: 9,
      values: { value: "" },
    };

    expect(draftReady(resolvedDraft)).toBe(false);
    expect(() => confirmationItem(resolvedDraft, "2026-09-04T09:00:00.000Z"))
      .toThrow("Nilai belum valid.");
  });

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
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Simpan edit" }));

    const nadiaJournal = screen.getByText(/Nadia mencoba strategi baru/)
      .closest("article");
    fireEvent.click(within(nadiaJournal).getByRole("button", { name: "Buang" }));

    fireEvent.click(screen.getByLabelText("Rafi Ahmad", {
      selector: "input[type=radio]",
    }));
    fireEvent.click(screen.getByLabelText("Fraction Quiz", {
      selector: "input[type=radio]",
    }));
    await chooseOption("Status kehadiran", "Hadir");

    expect(screen.getByText(/4 ready · 0 needs clarification · 1 discarded/))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "Simpan 4 data",
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
    expect(await screen.findByText(/4 data disimpan. Tinjauan selesai/))
      .toBeInTheDocument();
    expect(screen.getAllByText("Tersimpan")).toHaveLength(4);
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
    await resolveDraftsForConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Simpan 4 data" }));

    expect(await screen.findByText(/data disimpan. Draf yang gagal tetap dipilih/))
      .toBeInTheDocument();
    expect(screen.getByText(/Data ini belum dapat disimpan/))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan 1 data" }))
      .toBeEnabled();

    const firstPayload = workspaceMocks.confirm.mock.calls[0][0];
    workspaceMocks.confirm.mockImplementationOnce(async (items) => committedResults(items));
    fireEvent.click(screen.getByRole("button", { name: "Simpan 1 data" }));
    await waitFor(() => expect(workspaceMocks.confirm).toHaveBeenCalledTimes(2));
    const retryPayload = workspaceMocks.confirm.mock.calls[1][0];
    expect(retryPayload).toHaveLength(1);
    expect(retryPayload[0].draftId).toBe(firstPayload[0].draftId);
    expect(retryPayload[0].clientMutationId)
      .toBe(firstPayload[0].clientMutationId);
    expect(await screen.findByText(/4 data disimpan. Tinjauan selesai/))
      .toBeInTheDocument();
  });

  test("shows loading and extraction errors without a second request", async () => {
    let rejectGeneration;
    workspaceMocks.generate.mockImplementation(() => new Promise((resolve, reject) => {
      rejectGeneration = reject;
    }));
    render(<ClassroomDebriefWorkspace />);
    fireEvent.change(screen.getByLabelText("Apa yang terjadi di kelas?"), {
      target: { value: "Catatan kelas yang valid." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
    expect(screen.getByRole("button", { name: "Menyusun draf…" }))
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
    expect(screen.getByText(/Mode demo dapat membuat dan meninjau draf/))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan 2 data" }))
      .toBeDisabled();
    expect(workspaceMocks.confirm).not.toHaveBeenCalled();
  });

  test("does not invoke AI on load, typing, or invalid whitespace", async () => {
    render(<ClassroomDebriefWorkspace />);
    await waitFor(() => expect(workspaceMocks.fetchLessons).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Apa yang terjadi di kelas?"), {
      target: { value: "  " },
    });
    expect(workspaceMocks.generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
    expect(await screen.findByText("Ceritakan apa yang terjadi di kelas."))
      .toBeInTheDocument();
    expect(workspaceMocks.generate).not.toHaveBeenCalled();
  });

  test("locks duplicate generation while preserving the note", async () => {
    let resolveGeneration;
    workspaceMocks.generate.mockImplementation(() => new Promise((resolve) => {
      resolveGeneration = resolve;
    }));
    render(<ClassroomDebriefWorkspace />);
    const note = screen.getByLabelText("Apa yang terjadi di kelas?");
    fireEvent.change(note, { target: { value: "Catatan kelas yang valid." } });
    const generateButton = screen.getByRole("button", { name: "Susun draf" });
    fireEvent.click(generateButton);
    fireEvent.submit(generateButton.closest("form"));
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Menyusun draf…" }))
      .toBeDisabled();
    resolveGeneration(debriefResponse);
    expect(await screen.findByText("5 draf siap ditinjau"))
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
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Batalkan" }));
    expect(within(alyaDraft).getByText("Alya lebih mandiri."))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByText("Siap")).toBeInTheDocument();

    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Edit" }));
    fireEvent.change(within(alyaDraft).getByLabelText("Feedback"), {
      target: { value: "Perubahan yang disimpan." },
    });
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Simpan edit" }));
    expect(within(alyaDraft).getByText("Perubahan yang disimpan."))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByText("Diedit")).toBeInTheDocument();
  });

  test("uses keyboard-accessible ISSA selectors without changing journal payloads", async () => {
    render(<ClassroomDebriefWorkspace />);
    await generateDrafts();
    const journalDraft = screen.getByText(/Nadia mencoba strategi baru/)
      .closest("article");
    fireEvent.click(within(journalDraft).getByRole("button", { name: "Edit" }));

    const journalType = within(journalDraft).getByLabelText("Jenis catatan");
    journalType.focus();
    userEvent.keyboard("{arrowdown}");
    fireEvent.click(await screen.findByRole("option", { name: "Refleksi siswa" }));
    await chooseOption("Bentuk refleksi", "Parafrasa");
    fireEvent.click(within(journalDraft).getByRole("button", { name: "Simpan edit" }));

    fireEvent.click(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }));
    fireEvent.click(screen.getByLabelText("Fraction Quiz", { selector: "input[type=radio]" }));
    await chooseOption("Status kehadiran", "Hadir");
    fireEvent.click(screen.getByRole("button", { name: "Simpan 5 data" }));

    await waitFor(() => expect(workspaceMocks.confirm).toHaveBeenCalledTimes(1));
    expect(workspaceMocks.confirm.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        recordType: "journal",
        payload: expect.objectContaining({
          type: "student_reflection",
          voiceCaptureType: "paraphrased",
        }),
      }),
    ]));
    expect(workspaceMocks.generate).toHaveBeenCalledTimes(1);
  });

  test("handles an empty extraction and rate limit without clearing the note", async () => {
    workspaceMocks.generate.mockResolvedValueOnce({ drafts: [] });
    render(<ClassroomDebriefWorkspace />);
    const note = screen.getByLabelText("Apa yang terjadi di kelas?");
    fireEvent.change(note, { target: { value: "Catatan tetap tersedia." } });
    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
    expect(await screen.findByText(/Belum ada draf yang dapat digunakan/))
      .toBeInTheDocument();
    expect(note).toHaveValue("Catatan tetap tersedia.");

    const rateError = new Error("Provider quota 12345");
    rateError.code = "publicDemoRateLimitExceeded";
    rateError.status = 429;
    rateError.retryAfterSeconds = 90;
    workspaceMocks.generate.mockRejectedValueOnce(rateError);
    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
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
    expect(screen.getByRole("heading", { name: "5 draf siap ditinjau" }))
      .toHaveFocus();
    await resolveDraftsForConfirmation();
    const confirmButton = screen.getByRole("button", { name: "Simpan 4 data" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    expect(workspaceMocks.confirm).toHaveBeenCalledTimes(1);
    const alyaDraft = screen.getByText("Alya Putri").closest("article");
    expect(screen.getByRole("button", { name: "Catat lagi" }))
      .toBeDisabled();
    expect(within(alyaDraft).getByRole("button", { name: "Edit" }))
      .toBeDisabled();
    expect(within(alyaDraft).getByRole("button", { name: "Buang" }))
      .toBeDisabled();
    expect(screen.getByLabelText("Rafi Ahmad", { selector: "input[type=radio]" }))
      .toBeDisabled();
    expect(screen.getByLabelText("Status kehadiran"))
      .toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Catat lagi" }));
    fireEvent.click(within(alyaDraft).getByRole("button", { name: "Buang" }));
    expect(screen.getByRole("heading", { name: "5 draf siap ditinjau" }))
      .toBeInTheDocument();
    expect(within(alyaDraft).getByRole("button", { name: "Buang" }))
      .toBeInTheDocument();
    resolveConfirmation(committedResults(workspaceMocks.confirm.mock.calls[0][0]));
    const success = await screen.findByText(/4 data disimpan. Tinjauan selesai/);
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
