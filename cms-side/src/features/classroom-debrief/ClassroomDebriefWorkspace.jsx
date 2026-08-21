import { useEffect, useMemo, useRef, useState } from "react";
import { getActiveTeacherIdentity, isTeacherDemoSession } from "../../offline-workspace/authIdentity";
import { DEMO_READ_ONLY_MESSAGE } from "../../auth/demoAccess";
import { tw } from "../../shared/ui/tw";
import { InlineNotice, PageContainer, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, Surface } from "../../shared/ui/ui";
import { confirmClassroomDebriefDrafts, fetchDebriefLessons, generateClassroomDebriefDrafts } from "./classroomDebriefApi";

const recordTypeLabels = { attendance: "Attendance", feedback: "Feedback", journal: "Journal", score: "Score" };
const attendanceStatuses = ["Hadir", "Sakit", "Alfa", "Izin"];
const journalTypes = ["observation", "strength", "challenge", "milestone", "student_reflection", "support_note"];
const controlClasses = "min-h-control w-full min-w-0 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-2 text-body text-issa-text outline-none focus:border-issa-accent focus:ring-2 focus:ring-issa-focus disabled:bg-issa-disabled disabled:text-issa-text-disabled";

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
    const score = Number(draft.values.value);
    return Number.isInteger(score) && score >= 0 && score <= 100
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
    return { ...common, payload: {
      assignmentId: Number(draft.selectedAssignmentId), description: "Classroom Debrief",
      lessonId: Number(draft.context.lesson.id), recordedAt: observedAt, value: Number(draft.values.value),
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
  return "Record belum dapat disimpan. Draf Anda tetap tersedia untuk dicoba lagi.";
}

function itemFailureMessage(code) {
  const safeMessages = {
    assessment_not_found: "Assessment tidak lagi tersedia. Pilih assessment lain.",
    invalid_attendance_status: "Status attendance perlu diperbaiki.",
    invalid_draft: "Isi draf perlu diperiksa kembali.",
    invalid_score: "Nilai harus berupa angka bulat dari 0 sampai 100.",
    lesson_not_found: "Lesson tidak lagi tersedia.",
    student_not_found: "Siswa tidak lagi tersedia. Pilih siswa lain.",
  };
  return safeMessages[code] || "Record ini belum dapat disimpan. Periksa draf, lalu coba lagi.";
}

function recordTypeCounts(drafts) {
  return Object.keys(recordTypeLabels).map((type) => ({
    label: recordTypeLabels[type], type, value: drafts.filter((draft) => draft.type === type).length,
  })).filter((item) => item.value > 0);
}

function DraftEditor({ draft, onChange }) {
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
  const displayStatus = saved ? "Committed" : failed ? "Failed" : !draft.selected ? "Discarded"
    : draft.editing ? "Editing" : !draftReady(draft) ? "Needs clarification" : draft.edited ? "Edited" : "Ready";
  const statusTone = saved || (draft.selected && draftReady(draft) && !failed) ? "success"
    : failed ? "danger" : draft.selected ? "warning" : "neutral";
  const studentName = draft.studentResolution?.student?.name || draft.studentReference || "Siswa perlu dipilih";

  return (
    <article className={tw("debrief-draft min-w-0 overflow-hidden rounded-surface border border-issa-border-strong bg-issa-surface")}>
      <header className={tw("flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-issa-border bg-issa-subtle px-4 py-3")}>
        <div className={tw("min-w-0")}>
          <p className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>{recordTypeLabels[draft.type] || draft.type}</p>
          <h3 className={tw("mt-1 text-section-title font-bold text-issa-text")}>{studentName}</h3>
        </div>
        <StatusBadge status={displayStatus} tone={statusTone} />
      </header>
      <div className={tw("grid min-w-0 gap-3 p-4")}>
        <p className={tw("text-metadata font-semibold text-issa-muted")}>
          {saved ? "Canonical record saved" : draft.selected ? "Selected for final confirmation" : "Excluded from confirmation"}
        </p>
        <div className={tw("border-l-emphasis border-issa-accent bg-issa-subtle px-3 py-2")}>
          <p className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Source excerpt</p>
          <blockquote className={tw("mt-1 whitespace-pre-wrap text-supporting text-issa-text")}>“{draft.sourceExcerpt}”</blockquote>
        </div>

        {draft.selected && studentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Which student?</legend>
            {studentCandidates.map((candidate) => (
              <label className={tw("flex min-h-control min-w-0 items-center gap-2 rounded-control px-2 hover:bg-issa-subtle")} key={candidate.studentId}>
                <input type="radio" name={`${draft.draftId}-student`} checked={Number(draft.selectedStudentId) === candidate.studentId} onChange={() => applyChange({ selectedStudentId: candidate.studentId })} />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}
        {draft.selected && draft.type === "score" && assessmentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Which assessment?</legend>
            {assessmentCandidates.map((candidate) => (
              <label className={tw("flex min-h-control min-w-0 items-center gap-2 rounded-control px-2 hover:bg-issa-subtle")} key={candidate.assignmentId}>
                <input type="radio" name={`${draft.draftId}-assignment`} checked={Number(draft.selectedAssignmentId) === candidate.assignmentId} onChange={() => applyChange({ selectedAssignmentId: candidate.assignmentId })} />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        {draft.selected && draft.editing && draft.type === "feedback" && (
          <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Feedback</span>
            <textarea className={tw(controlClasses, "min-h-28 resize-y")} value={draft.values.content} onChange={(event) => updateValues({ content: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.editing && draft.type === "journal" && (
          <div className={tw("grid min-w-0 gap-3")}>
            <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Journal type</span>
              <select className={tw(controlClasses)} value={draft.values.type} onChange={(event) => updateValues({ type: event.target.value, voiceCaptureType: null })}>
                {journalTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            {draft.values.type === "student_reflection" && (
              <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Reflection capture</span>
                <select className={tw(controlClasses)} value={draft.values.voiceCaptureType || ""} onChange={(event) => updateValues({ voiceCaptureType: event.target.value || null })}>
                  <option value="">Select capture type</option><option value="direct_quote">Direct quote</option><option value="paraphrased">Paraphrased</option>
                </select>
              </label>
            )}
            <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Journal content</span>
              <textarea className={tw(controlClasses, "min-h-28 resize-y")} value={draft.values.content} onChange={(event) => updateValues({ content: event.target.value })} />
            </label>
          </div>
        )}
        {draft.selected && draft.editing && draft.type === "score" && (
          <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Score</span>
            <input className={tw(controlClasses)} type="number" min="0" max="100" value={draft.values.value} onChange={(event) => updateValues({ value: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.type === "attendance" && (
          <label className={tw("grid min-w-0 gap-1")}><span className={tw("text-label font-semibold")}>Canonical attendance status</span>
            <select aria-label="Canonical attendance status" className={tw(controlClasses)} value={draft.values.status} onChange={(event) => applyChange({ values: { ...draft.values, status: event.target.value } })}>
              <option value="">Resolve attendance status</option>{attendanceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {draft.payload?.minutesLate && <small className={tw("text-metadata text-issa-muted")}>The canonical attendance record cannot store {draft.payload.minutesLate} minutes late.</small>}
          </label>
        )}
        {draft.selected && !draft.editing && (
          <p className={tw("whitespace-pre-wrap text-body text-issa-text")}>
            {draft.type === "feedback" || draft.type === "journal" ? draft.values.content
              : draft.type === "score" ? `Score: ${draft.values.value}` : `Status: ${draft.values.status || "Needs clarification"}`}
          </p>
        )}
        {failed && <InlineNotice tone="danger">{itemFailureMessage(draft.result.code)}</InlineNotice>}
        {saved && <InlineNotice tone="success">Record saved.</InlineNotice>}
        {!saved && (
          <div className={tw("flex min-w-0 flex-wrap gap-2 max-sm:flex-col max-sm:[&>button]:w-full")}>
            {draft.selected && draft.type !== "attendance" && !draft.editing && <SecondaryButton type="button" onClick={beginEditing}>Edit</SecondaryButton>}
            {draft.selected && draft.type !== "attendance" && draft.editing && <>
              <SecondaryButton type="button" onClick={saveEditing}>Save edit</SecondaryButton>
              <SecondaryButton type="button" onClick={cancelEditing}>Cancel edit</SecondaryButton>
            </>}
            {!draft.editing && <SecondaryButton type="button" onClick={() => applyChange({ selected: !draft.selected, result: null }, { markEdited: false })}>
              {draft.selected ? "Discard" : "Restore"}
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
      setGenerationState({ pending: false, error: "Tell us what happened in class." });
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
  const updateDraft = (draftId, updatedDraft) => setDrafts((current) => current.map((draft) => draft.draftId === draftId ? updatedDraft : draft));

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
    setText(""); setLessonId(""); setDrafts([]); setReviewContext(null);
    setGenerationState({ pending: false, error: "" });
    setConfirmationState({ pending: false, error: "", outcome: "idle" });
  };
  const teacherLabel = teacher?.name || "Active teacher session";
  const classLabel = reviewContext?.class?.name || "Active class from this session";

  return (
    <PageContainer className={tw("classroom-debrief-workspace min-w-0 text-issa-text")}>
      <PageHeader eyebrow="Teacher review instrument" title="Classroom Debrief"
        description="Turn one class note into reviewable drafts. Nothing becomes a student record until you confirm it."
        metadata={`${teacherLabel} · ${classLabel}`} />
      {isDemo && <InlineNotice className={tw("mb-4")} tone="warning">Demo mode can generate and review drafts, but cannot save canonical records.</InlineNotice>}

      {!drafts.length && (
        <Surface className={tw("overflow-hidden")}>
          <form aria-busy={generationState.pending} className={tw("grid min-w-0 gap-5 p-5")} onSubmit={generateDrafts}>
            <label className={tw("grid min-w-0 gap-1")} htmlFor="classroom-debrief-text">
              <span className={tw("text-label font-bold")}>What happened in class?</span>
              <textarea aria-describedby="classroom-debrief-text-count classroom-debrief-generation-status" aria-label="What happened in class?"
                id="classroom-debrief-text" className={tw(controlClasses, "min-h-[10rem] resize-y")} maxLength={4000} value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Example: Alya worked independently, Rafi arrived late, and Nadia scored 82 on the fraction quiz." />
              <small id="classroom-debrief-text-count" className={tw("text-metadata text-issa-muted")}>{text.length}/4000</small>
            </label>
            <label className={tw("grid min-w-0 gap-1")} htmlFor="classroom-debrief-lesson">
              <span className={tw("text-label font-bold")}>Lesson context (optional)</span>
              <select aria-label="Lesson context (optional)" id="classroom-debrief-lesson" className={tw(controlClasses)} value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
                <option value="">No lesson selected</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
              </select>
            </label>
            <div aria-live="polite" id="classroom-debrief-generation-status" role="status">
              {generationState.pending && <InlineNotice>Generating reviewable drafts. No records are being saved.</InlineNotice>}
              {generationState.error && <InlineNotice role="alert" tone="danger">{generationState.error}</InlineNotice>}
            </div>
            <div className={tw("flex justify-end max-sm:[&>button]:w-full")}>
              <PrimaryButton type="submit" loading={generationState.pending} loadingLabel="Generating drafts…">Generate drafts</PrimaryButton>
            </div>
          </form>
        </Surface>
      )}

      {drafts.length > 0 && (
        <div className={tw("grid min-w-0 gap-5")}>
          <Surface className={tw("grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center")}>
            <div>
              <h2 ref={reviewHeadingRef} tabIndex={-1} className={tw("text-section-title font-bold outline-none")}>{drafts.length} drafts ready for review</h2>
              <p className={tw("mt-1 text-supporting text-issa-muted")}>{readyDrafts.length} ready · {clarificationCount} needs clarification · {discardedDraftCount} discarded · {savedDrafts.length} saved</p>
              <p className={tw("mt-1 text-metadata text-issa-muted")}>Class {classLabel}{reviewContext?.lesson?.name ? ` · ${reviewContext.lesson.name}` : ""}</p>
            </div>
            <SecondaryButton type="button" onClick={resetWorkspace}>Start another Debrief</SecondaryButton>
          </Surface>
          <div className={tw("grid min-w-0 gap-4 xl:grid-cols-2")}>
            {drafts.map((draft) => <DraftEditor key={draft.draftId} draft={draft} onChange={(updatedDraft) => updateDraft(draft.draftId, updatedDraft)} />)}
          </div>
          <div aria-live="polite" ref={confirmationStatusRef} role="status" tabIndex={-1} className={tw("grid gap-2 outline-none")}>
            {confirmationState.error && <InlineNotice role="alert" tone="danger">{confirmationState.error}</InlineNotice>}
            {confirmationState.outcome === "complete" && <InlineNotice tone="success">
              {savedDrafts.length} records saved. Review is complete: {savedCounts.map((item) => `${item.value} ${item.label}`).join(", ")}.
            </InlineNotice>}
            {confirmationState.outcome === "partial" && <InlineNotice tone="warning">
              {savedDrafts.length} records saved. Failed drafts remain selected; successful records will not be sent again.
            </InlineNotice>}
            {isDemo && <InlineNotice tone="warning">{DEMO_READ_ONLY_MESSAGE}</InlineNotice>}
          </div>
          <Surface className={tw("grid min-w-0 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end")}>
            <div>
              <h2 className={tw("text-label font-bold text-issa-text")}>Ready to save</h2>
              <p className={tw("mt-1 text-supporting text-issa-muted")}>
                {clarificationCount > 0
                  ? `${clarificationCount} selected draft${clarificationCount === 1 ? " needs" : "s need"} clarification before confirmation.`
                  : `${readyDrafts.length} selected record${readyDrafts.length === 1 ? "" : "s"} will be saved. No AI request is made.`}
              </p>
              {confirmationCounts.length > 0 && <dl className={tw("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-metadata")}>
                {confirmationCounts.map((item) => <div className={tw("flex gap-1")} key={item.type}><dt className={tw("text-issa-muted")}>{item.label}</dt><dd className={tw("font-bold text-issa-text")}>{item.value}</dd></div>)}
              </dl>}
            </div>
            <PrimaryButton type="button" disabled={isDemo || selectedDrafts.length === 0 || clarificationCount > 0}
              loading={confirmationState.pending} loadingLabel="Saving records…" onClick={confirmDrafts}>
              Confirm {readyDrafts.length} record{readyDrafts.length === 1 ? "" : "s"}
            </PrimaryButton>
          </Surface>
        </div>
      )}
    </PageContainer>
  );
}

export { confirmationErrorMessage, confirmationItem, draftReady, editableDraft, generationErrorMessage, itemFailureMessage };
