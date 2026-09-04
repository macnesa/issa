import { useEffect, useMemo, useRef, useState } from "react";
import { Radio } from "flowbite-react/components/Radio";
import { Textarea } from "flowbite-react/components/Textarea";
import { TextInput } from "flowbite-react/components/TextInput";
import { getActiveTeacherIdentity, isTeacherDemoSession } from "../../offline-workspace/authIdentity";
import { DEMO_READ_ONLY_MESSAGE } from "../../auth/demoAccess";
import SelectField from "../../shared/ui/form-controls/SelectField";
import { tw } from "../../shared/ui/tw";
import { InlineNotice, PageContainer, PageHeader, PrimaryButton, SecondaryButton, StatusBadge } from "../../shared/ui/ui";
import { confirmClassroomDebriefDrafts, fetchDebriefLessons, generateClassroomDebriefDrafts } from "./classroomDebriefApi";
import { parseScoreInput } from "../scores/scoreValue";

const recordTypeLabels = { attendance: "Kehadiran", feedback: "Feedback", journal: "Catatan", score: "Nilai" };
const attendanceStatuses = ["Hadir", "Sakit", "Alfa", "Izin"];
const journalTypes = ["observation", "strength", "challenge", "milestone", "student_reflection", "support_note"];
const journalTypeLabels = {
  observation: "Observasi",
  strength: "Kekuatan",
  challenge: "Tantangan",
  milestone: "Pencapaian",
  student_reflection: "Refleksi siswa",
  support_note: "Catatan dukungan",
};
const attendanceStatusOptions = [
  { value: "", label: "Pilih status kehadiran" },
  ...attendanceStatuses.map((status) => ({ value: status, label: status })),
];
const journalTypeOptions = journalTypes.map((type) => ({ value: type, label: journalTypeLabels[type] }));
const reflectionCaptureOptions = [
  { value: "", label: "Pilih bentuk refleksi" },
  { value: "direct_quote", label: "Kutipan langsung" },
  { value: "paraphrased", label: "Parafrasa" },
];
function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mutationId(draftId) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `classroom-debrief:${randomId}:${draftId}`.slice(0, 128);
}

function editableDraft(draft) {
  const student = draft.studentResolution?.student;
  const assessment = draft.context?.assessmentResolution?.assignment;
  return {
    ...draft,
    clientMutationId: mutationId(draft.draftId),
    edited: false,
    editing: false,
    editSnapshot: null,
    result: null,
    selected: true,
    selectedAssignmentId: assessment?.assignmentId || draft.payload?.AssignmentId || "",
    selectedStudentId: student?.studentId || "",
    values: draft.type === "feedback"
      ? { content: draft.payload?.feedback || "" }
      : draft.type === "journal"
        ? { content: draft.payload?.content || "", type: draft.payload?.type || "observation", voiceCaptureType: draft.payload?.voiceCaptureType || null }
        : draft.type === "score"
          ? { value: draft.payload?.value ?? "" }
          : { status: draft.payload?.status || "" },
  };
}

function draftReady(draft) {
  if (!draft.selectedStudentId) return false;
  if (draft.type === "feedback") return draft.values.content.trim().length > 0;
  if (draft.type === "journal") {
    return draft.values.content.trim().length >= 3
      && journalTypes.includes(draft.values.type)
      && (draft.values.type !== "student_reflection" || ["direct_quote", "paraphrased"].includes(draft.values.voiceCaptureType));
  }
  if (draft.type === "score") {
    const score = parseScoreInput(draft.values.value);
    return score !== null
      && Boolean(draft.context?.lesson?.id) && Boolean(draft.selectedAssignmentId);
  }
  return attendanceStatuses.includes(draft.values.status);
}

function confirmationItem(draft, observedAt) {
  const common = {
    clientMutationId: draft.clientMutationId,
    draftId: draft.draftId,
    recordType: draft.type,
    sourceExcerpt: draft.sourceExcerpt,
    studentId: Number(draft.selectedStudentId),
  };
  if (draft.type === "feedback") return { ...common, payload: { content: draft.values.content.trim(), observedAt } };
  if (draft.type === "journal") {
    return { ...common, payload: {
      content: draft.values.content.trim(), observedAt, type: draft.values.type,
      voiceCaptureType: draft.values.type === "student_reflection" ? draft.values.voiceCaptureType : null,
    } };
  }
  if (draft.type === "score") {
    const score = parseScoreInput(draft.values.value);
    if (score === null) throw new Error("Nilai belum valid.");
    return { ...common, payload: {
      assignmentId: Number(draft.selectedAssignmentId), description: "Catatan kelas",
      lessonId: Number(draft.context.lesson.id), recordedAt: observedAt, value: score,
    } };
  }
  return { ...common, payload: { attendanceDate: localDateValue(), status: draft.values.status } };
}

function retryAfterText(seconds) {
  if (!Number.isFinite(seconds) || seconds < 1) return "Coba lagi nanti.";
  return `Coba lagi sekitar ${Math.max(1, Math.ceil(seconds / 60))} menit lagi.`;
}

function generationErrorMessage(error) {
  if (error?.status === 429 || error?.code === "publicDemoRateLimitExceeded") {
    return `Batas penggunaan AI demo telah tercapai. ${retryAfterText(error?.retryAfterSeconds)} Catatan Anda tetap tersimpan.`;
  }
  if (error?.code === "classroom_debrief_no_usable_drafts") {
    return "Belum ada draf yang dapat digunakan. Tambahkan detail siswa atau kejadian, lalu coba lagi. Catatan Anda tetap tersimpan.";
  }
  if (error?.code === "classroom_debrief_invalid_output") {
    return "Catatan belum dapat diubah menjadi draf yang aman. Tinjau catatan, lalu coba lagi.";
  }
  if (error?.code === "invalid_classroom_debrief_request" || error?.status === 400) {
    return "Catatan belum dapat diproses. Periksa isi catatan dan konteks pelajaran.";
  }
  if (error?.code === "ai_provider_unavailable" || error?.status === 503) {
    return "Pembuatan draf sedang tidak tersedia. Catatan Anda tetap tersimpan; coba lagi nanti.";
  }
  return "Draf belum dapat dibuat. Catatan Anda tetap tersimpan; coba lagi nanti.";
}

function confirmationErrorMessage(error) {
  if (error?.status === 403 || error?.code === "publicDemoReadOnly") return DEMO_READ_ONLY_MESSAGE;
  if (error?.code === "invalid_classroom_debrief_confirmation" || error?.status === 400) {
    return "Pilihan draf belum dapat disimpan. Tinjau data yang dipilih, lalu coba lagi.";
  }
  return "Data belum dapat disimpan. Draf Anda tetap tersedia untuk dicoba lagi.";
}

function itemFailureMessage(code) {
  const safeMessages = {
    assessment_not_found: "Penilaian tidak lagi tersedia. Pilih penilaian lain.",
    invalid_attendance_status: "Status kehadiran perlu diperbaiki.",
    invalid_draft: "Isi draf perlu diperiksa kembali.",
    invalid_score: "Nilai harus berupa angka bulat dari 0 sampai 100.",
    lesson_not_found: "Pelajaran tidak lagi tersedia.",
    student_not_found: "Siswa tidak lagi tersedia. Pilih siswa lain.",
  };
  return safeMessages[code] || "Data ini belum dapat disimpan. Periksa draf, lalu coba lagi.";
}

function recordTypeCounts(drafts) {
  return Object.keys(recordTypeLabels).map((type) => ({
    label: recordTypeLabels[type], type, value: drafts.filter((draft) => draft.type === type).length,
  })).filter((item) => item.value > 0);
}

function DraftEditor({ draft, interactionLocked, onChange }) {
  const studentCandidates = draft.studentResolution?.candidates || [];
  const assessmentCandidates = draft.context?.assessmentResolution?.candidates || [];
  const saved = ["committed", "duplicate"].includes(draft.result?.status);
  const failed = draft.result?.status === "failed";
  const applyChange = (updates, { markEdited = true, clearFailure = true } = {}) => {
    onChange({ ...draft, ...updates, edited: markEdited ? true : draft.edited, result: clearFailure && failed ? null : draft.result });
  };
  const updateValues = (updates) => applyChange({ values: { ...draft.values, ...updates } }, { markEdited: false });
  const beginEditing = () => applyChange({ editing: true, editSnapshot: { values: { ...draft.values } } }, { markEdited: false, clearFailure: false });
  const saveEditing = () => applyChange({ editing: false, editSnapshot: null });
  const cancelEditing = () => applyChange({ editing: false, editSnapshot: null, values: { ...(draft.editSnapshot?.values || draft.values) } }, { markEdited: false, clearFailure: false });
  const displayStatus = saved ? "Tersimpan" : failed ? "Gagal" : !draft.selected ? "Dibuang"
    : draft.editing ? "Mengedit" : !draftReady(draft) ? "Perlu klarifikasi" : draft.edited ? "Diedit" : "Siap";
  const statusTone = saved || (draft.selected && draftReady(draft) && !failed) ? "success"
    : failed ? "danger" : draft.selected ? "warning" : "neutral";
  const studentName = draft.studentResolution?.student?.name || draft.studentReference || "Siswa perlu dipilih";

  return (
    <article className={tw("debrief-draft min-w-0 overflow-hidden rounded-surface border border-issa-border bg-issa-surface shadow-[0_1px_2px_rgba(24,50,59,0.035)]")}>
      <header className={tw("flex min-w-0 flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-5")}>
        <div className={tw("min-w-0")}>
          <p className={tw("text-metadata font-semibold tracking-normal text-issa-muted")}>{recordTypeLabels[draft.type] || draft.type}</p>
          <h3 className={tw("mt-1 text-section-title font-semibold text-issa-text")}>{studentName}</h3>
        </div>
        <StatusBadge status={displayStatus} tone={statusTone} />
      </header>
      <div className={tw("grid min-w-0 gap-4 px-5 pb-5 pt-3")}>
        <p className={tw("text-metadata font-semibold text-issa-muted")}>
          {saved ? "Data tersimpan" : draft.selected ? "Dipilih untuk konfirmasi akhir" : "Tidak ikut disimpan"}
        </p>
        <div className={tw("rounded-lg bg-issa-subtle px-3 py-2.5")}>
          <p className={tw("text-metadata font-semibold tracking-normal text-issa-muted")}>Kutipan sumber</p>
          <blockquote className={tw("mt-1 whitespace-pre-wrap text-supporting text-issa-text")}>“{draft.sourceExcerpt}”</blockquote>
        </div>

        {draft.selected && studentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Siswa mana?</legend>
            {studentCandidates.map((candidate) => (
              <label className={tw("flex min-h-control min-w-0 items-center gap-2 rounded-control px-2 hover:bg-issa-subtle")} key={candidate.studentId}>
                <Radio color="issa" name={`${draft.draftId}-student`} checked={Number(draft.selectedStudentId) === candidate.studentId} disabled={interactionLocked} onChange={() => applyChange({ selectedStudentId: candidate.studentId })} />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}
        {draft.selected && draft.type === "score" && assessmentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Penilaian mana?</legend>
            {assessmentCandidates.map((candidate) => (
              <label className={tw("flex min-h-control min-w-0 items-center gap-2 rounded-control px-2 hover:bg-issa-subtle")} key={candidate.assignmentId}>
                <Radio color="issa" name={`${draft.draftId}-assignment`} checked={Number(draft.selectedAssignmentId) === candidate.assignmentId} disabled={interactionLocked} onChange={() => applyChange({ selectedAssignmentId: candidate.assignmentId })} />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        {draft.selected && draft.editing && draft.type === "feedback" && (
          <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Feedback</span>
            <Textarea className={tw("debrief-draft__feedback-textarea !min-h-28 resize-y")} value={draft.values.content} disabled={interactionLocked} onChange={(event) => updateValues({ content: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.editing && draft.type === "journal" && (
          <div className={tw("grid min-w-0 gap-3")}>
            <SelectField id={`classroom-debrief-journal-type-${draft.draftId}`} label="Jenis catatan"
              value={draft.values.type} options={journalTypeOptions} disabled={interactionLocked}
              onChange={(type) => updateValues({ type, voiceCaptureType: null })} />
            {draft.values.type === "student_reflection" && (
              <SelectField id={`classroom-debrief-reflection-capture-${draft.draftId}`} label="Bentuk refleksi"
                value={draft.values.voiceCaptureType || ""} options={reflectionCaptureOptions} disabled={interactionLocked}
                onChange={(voiceCaptureType) => updateValues({ voiceCaptureType: voiceCaptureType || null })} />
            )}
            <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Isi catatan</span>
              <Textarea className={tw("debrief-draft__journal-textarea !min-h-28 resize-y")} value={draft.values.content} disabled={interactionLocked} onChange={(event) => updateValues({ content: event.target.value })} />
            </label>
          </div>
        )}
        {draft.selected && draft.editing && draft.type === "score" && (
          <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Nilai</span>
            <TextInput className={tw("debrief-draft__score-input")} type="number" min="0" max="100" value={draft.values.value} disabled={interactionLocked} onChange={(event) => updateValues({ value: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.type === "attendance" && (
          <SelectField id={`classroom-debrief-attendance-status-${draft.draftId}`} label="Status kehadiran"
            value={draft.values.status} options={attendanceStatusOptions} disabled={interactionLocked}
            helperText={draft.payload?.minutesLate ? `Data kehadiran hanya menyimpan status; detail terlambat ${draft.payload.minutesLate} menit tidak ikut tersimpan.` : undefined}
            onChange={(status) => applyChange({ values: { ...draft.values, status } })} />
        )}
        {draft.selected && !draft.editing && (
          <p className={tw("whitespace-pre-wrap text-body text-issa-text")}>
            {draft.type === "feedback" || draft.type === "journal" ? draft.values.content
              : draft.type === "score" ? `Nilai: ${draft.values.value}` : `Status: ${draft.values.status || "Perlu klarifikasi"}`}
          </p>
        )}
        {failed && <InlineNotice tone="danger">{itemFailureMessage(draft.result.code)}</InlineNotice>}
        {saved && <InlineNotice tone="success">Data disimpan.</InlineNotice>}
        {!saved && (
          <div className={tw("flex min-w-0 flex-wrap gap-2 max-sm:flex-col max-sm:[&>button]:w-full")}>
            {draft.selected && draft.type !== "attendance" && !draft.editing && <SecondaryButton type="button" disabled={interactionLocked} onClick={beginEditing}>Edit</SecondaryButton>}
            {draft.selected && draft.type !== "attendance" && draft.editing && <>
              <SecondaryButton type="button" disabled={interactionLocked} onClick={saveEditing}>Simpan edit</SecondaryButton>
              <SecondaryButton type="button" disabled={interactionLocked} onClick={cancelEditing}>Batalkan</SecondaryButton>
            </>}
            {!draft.editing && <SecondaryButton type="button" disabled={interactionLocked} onClick={() => applyChange({ selected: !draft.selected, result: null }, { markEdited: false })}>
              {draft.selected ? "Buang" : "Pulihkan"}
            </SecondaryButton>}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ClassroomDebriefWorkspace() {
  const isDemo = isTeacherDemoSession();
  const teacher = getActiveTeacherIdentity();
  const generationInFlightRef = useRef(false);
  const confirmationInFlightRef = useRef(false);
  const reviewHeadingRef = useRef(null);
  const confirmationStatusRef = useRef(null);
  const [text, setText] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [reviewContext, setReviewContext] = useState(null);
  const [generationState, setGenerationState] = useState({ pending: false, error: "" });
  const [confirmationState, setConfirmationState] = useState({ pending: false, error: "", outcome: "idle" });
  const observedAt = useMemo(() => new Date().toISOString(), [drafts.length > 0]);
  const lessonOptions = useMemo(() => [
    { value: "", label: "Tanpa pelajaran spesifik" },
    ...lessons.map((lesson) => ({ value: String(lesson.id), label: lesson.name })),
  ], [lessons]);

  useEffect(() => { fetchDebriefLessons().then(setLessons).catch(() => setLessons([])); }, []);
  const reviewKey = drafts[0]?.draftId || "";
  useEffect(() => { if (reviewKey) reviewHeadingRef.current?.focus(); }, [reviewKey]);
  useEffect(() => {
    if (confirmationState.outcome !== "idle" || confirmationState.error) confirmationStatusRef.current?.focus();
  }, [confirmationState.error, confirmationState.outcome]);

  const generateDrafts = async (event) => {
    void "ISSA:CMS.CLASSROOM_DEBRIEF.REVIEW_CONFIRM";
    event.preventDefault();
    if (generationInFlightRef.current) return;
    const normalizedText = text.trim();
    if (normalizedText.length < 3) {
      setGenerationState({ pending: false, error: "Ceritakan apa yang terjadi di kelas." });
      return;
    }
    generationInFlightRef.current = true;
    setGenerationState({ pending: true, error: "" });
    setConfirmationState({ pending: false, error: "", outcome: "idle" });
    try {
      const result = await generateClassroomDebriefDrafts({ text: normalizedText, lessonId });
      if (result.drafts.length === 0) {
        setDrafts([]);
        setGenerationState({ pending: false, error: "Belum ada draf yang dapat digunakan. Tambahkan detail siswa atau kejadian, lalu coba lagi. Catatan Anda tetap tersimpan." });
        return;
      }
      setReviewContext(result.context || result.drafts[0]?.context || null);
      setDrafts(result.drafts.map(editableDraft));
      setGenerationState({ pending: false, error: "" });
    } catch (error) {
      setGenerationState({ pending: false, error: generationErrorMessage(error) });
    } finally {
      generationInFlightRef.current = false;
    }
  };

  const selectedDrafts = drafts.filter((draft) => draft.selected);
  const readyDrafts = selectedDrafts.filter(draftReady);
  const clarificationCount = selectedDrafts.length - readyDrafts.length;
  const updateDraft = (draftId, updatedDraft) => {
    if (confirmationInFlightRef.current) return;
    setDrafts((current) => current.map((draft) => draft.draftId === draftId ? updatedDraft : draft));
  };

  const confirmDrafts = async () => {
    if (confirmationInFlightRef.current || isDemo || selectedDrafts.length === 0 || clarificationCount > 0) return;
    confirmationInFlightRef.current = true;
    setConfirmationState({ pending: true, error: "", outcome: "idle" });
    try {
      const response = await confirmClassroomDebriefDrafts(selectedDrafts.map((draft) => confirmationItem(draft, observedAt)));
      const resultsByDraft = new Map(response.results.map((result) => [result.draftId, result]));
      const hasFailures = response.results.some((result) => result.status === "failed");
      setDrafts((current) => current.map((draft) => {
        const result = resultsByDraft.get(draft.draftId);
        return result ? { ...draft, result, selected: result.status === "failed" } : draft;
      }));
      setConfirmationState({ pending: false, error: "", outcome: hasFailures ? "partial" : "complete" });
    } catch (error) {
      setConfirmationState({ pending: false, error: confirmationErrorMessage(error), outcome: "idle" });
    } finally {
      confirmationInFlightRef.current = false;
    }
  };

  const savedDrafts = drafts.filter((draft) => ["committed", "duplicate"].includes(draft.result?.status));
  const discardedDraftCount = drafts.filter((draft) => !draft.selected && !["committed", "duplicate"].includes(draft.result?.status)).length;
  const confirmationCounts = recordTypeCounts(readyDrafts);
  const savedCounts = recordTypeCounts(savedDrafts);
  const resetWorkspace = () => {
    if (confirmationInFlightRef.current) return;
    setText(""); setLessonId(""); setDrafts([]); setReviewContext(null);
    setGenerationState({ pending: false, error: "" });
    setConfirmationState({ pending: false, error: "", outcome: "idle" });
  };
  const teacherLabel = teacher?.name || "Sesi guru aktif";
  const classLabel = reviewContext?.class?.name || "Kelas aktif dari sesi ini";

  return (
    <PageContainer className={tw("classroom-debrief-workspace min-w-0 text-issa-text")}>
      <PageHeader
        title="Catat kelas"
        description="Tulis apa yang terjadi. Sistem menyusun draf; Anda meninjau sebelum data disimpan."
        metadata={`${teacherLabel} · ${classLabel}`}
      />
      {isDemo && <InlineNotice className={tw("mb-5")} tone="warning">Mode demo dapat membuat dan meninjau draf, tetapi tidak dapat menyimpan data.</InlineNotice>}

      {!drafts.length && (
        <form aria-busy={generationState.pending} className={tw("grid min-w-0 gap-6 border-y border-issa-border py-6")} onSubmit={generateDrafts}>
          <div className={tw("grid min-w-0 gap-2")}>
            <label className={tw("text-section-title font-semibold text-issa-text")} htmlFor="classroom-debrief-text">Apa yang terjadi di kelas?</label>
            <p className={tw("max-w-[48rem] text-supporting leading-relaxed text-issa-muted")}>Catat kejadian dalam bahasa natural. Belum ada data siswa yang disimpan pada tahap ini.</p>
            <Textarea aria-describedby="classroom-debrief-text-count classroom-debrief-generation-status" aria-label="Apa yang terjadi di kelas?" id="classroom-debrief-text" className={tw("classroom-debrief-workspace__textarea mt-2 !min-h-[12rem] resize-y text-body")} maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Contoh: Alya bekerja mandiri, Rafi datang terlambat, dan Nadia mendapat 82 pada kuis pecahan." />
            <small id="classroom-debrief-text-count" className={tw("justify-self-end text-metadata tabular-nums text-issa-muted")}>{text.length}/4000</small>
          </div>
          <div className={tw("grid gap-5 sm:grid-cols-[minmax(0,_22rem)_1fr] sm:items-end")}>
            <SelectField id="classroom-debrief-lesson" label="Konteks pelajaran (opsional)" value={lessonId} options={lessonOptions} onChange={setLessonId} />
            <div className={tw("flex justify-end max-sm:[&>button]:w-full")}><PrimaryButton type="submit" loading={generationState.pending} loadingLabel="Menyusun draf…">Susun draf</PrimaryButton></div>
          </div>
          <div aria-live="polite" id="classroom-debrief-generation-status" role="status">
            {generationState.pending && <InlineNotice>Menyusun draf untuk ditinjau. Belum ada data yang disimpan.</InlineNotice>}
            {generationState.error && <InlineNotice role="alert" tone="danger">{generationState.error}</InlineNotice>}
          </div>
        </form>
      )}

      {drafts.length > 0 && (
        <div className={tw("grid min-w-0 gap-6")}>
          <section className={tw("grid min-w-0 gap-4 border-y border-issa-border py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center")}>
            <div>
              <p className={tw("text-eyebrow font-semibold text-issa-accent")}>Tinjau</p>
              <h2 ref={reviewHeadingRef} tabIndex={-1} className={tw("mt-1 text-section-title font-semibold text-issa-text outline-none")}>{drafts.length} draf siap ditinjau</h2>
              <p className={tw("mt-1 text-supporting text-issa-muted")}>{readyDrafts.length} siap · {clarificationCount} perlu klarifikasi · {discardedDraftCount} dibuang · {savedDrafts.length} disimpan</p>
              <p className={tw("mt-1 text-metadata text-issa-muted")}>Kelas {classLabel}{reviewContext?.lesson?.name ? ` · ${reviewContext.lesson.name}` : ""}</p>
            </div>
            <SecondaryButton type="button" disabled={confirmationState.pending} onClick={resetWorkspace}>Catat lagi</SecondaryButton>
          </section>

          <div className={tw("grid min-w-0 gap-4 xl:grid-cols-2")}>{drafts.map((draft) => <DraftEditor key={draft.draftId} draft={draft} interactionLocked={confirmationState.pending} onChange={(updatedDraft) => updateDraft(draft.draftId, updatedDraft)} />)}</div>

          <div aria-live="polite" ref={confirmationStatusRef} role="status" tabIndex={-1} className={tw("grid gap-2 outline-none")}>
            {confirmationState.error && <InlineNotice role="alert" tone="danger">{confirmationState.error}</InlineNotice>}
            {confirmationState.outcome === "complete" && <InlineNotice tone="success">{savedDrafts.length} data disimpan. Tinjauan selesai: {savedCounts.map((item) => `${item.value} ${item.label}`).join(", ")}.</InlineNotice>}
            {confirmationState.outcome === "partial" && <InlineNotice tone="warning">{savedDrafts.length} data disimpan. Draf yang gagal tetap dipilih; data yang berhasil tidak akan dikirim ulang.</InlineNotice>}
            {isDemo && <InlineNotice tone="warning">{DEMO_READ_ONLY_MESSAGE}</InlineNotice>}
          </div>

          <section className={tw("grid min-w-0 gap-4 border-t border-issa-border pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end")}>
            <div>
              <h2 className={tw("text-label font-semibold text-issa-text")}>Siap disimpan</h2>
              <p className={tw("mt-1 max-w-[46rem] text-supporting text-issa-muted")}>{clarificationCount > 0 ? `${clarificationCount} draf terpilih masih memerlukan klarifikasi sebelum disimpan.` : `${readyDrafts.length} data terpilih akan disimpan. Tidak ada permintaan AI tambahan.`}</p>
              {confirmationCounts.length > 0 && <dl className={tw("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-metadata")}>{confirmationCounts.map((item) => <div className={tw("flex gap-1")} key={item.type}><dt className={tw("text-issa-muted")}>{item.label}</dt><dd className={tw("font-semibold text-issa-text")}>{item.value}</dd></div>)}</dl>}
            </div>
            <PrimaryButton type="button" disabled={isDemo || selectedDrafts.length === 0 || clarificationCount > 0} loading={confirmationState.pending} loadingLabel="Menyimpan data…" onClick={confirmDrafts}>Simpan {readyDrafts.length} data</PrimaryButton>
          </section>
        </div>
      )}
    </PageContainer>
  );
}

export { confirmationErrorMessage, confirmationItem, draftReady, editableDraft, generationErrorMessage, itemFailureMessage };
