import { useEffect, useMemo, useState } from "react";
import { isTeacherDemoSession } from "../../offline-workspace/authIdentity";
import {
  DEMO_READ_ONLY_MESSAGE,
} from "../../auth/demoAccess";
import { tw } from "../../shared/ui/tw";
import {
  InlineNotice,
  PageContainer,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  Surface,
} from "../../shared/ui/ui";
import {
  confirmClassroomDebriefDrafts,
  fetchDebriefLessons,
  generateClassroomDebriefDrafts,
} from "./classroomDebriefApi";

const recordTypeLabels = {
  attendance: "Attendance",
  feedback: "Feedback",
  journal: "Journal",
  score: "Score",
};
const attendanceStatuses = ["Hadir", "Sakit", "Alfa", "Izin"];
const journalTypes = [
  "observation",
  "strength",
  "challenge",
  "milestone",
  "student_reflection",
  "support_note",
];
const controlClasses = "min-h-control w-full min-w-0 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-2 text-body text-issa-text outline-none focus:border-issa-accent focus:ring-2 focus:ring-issa-focus disabled:bg-issa-disabled disabled:text-issa-text-disabled";

function localDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mutationId(draftId) {
  const randomId = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    result: null,
    selected: true,
    selectedAssignmentId: assessment?.assignmentId || draft.payload?.AssignmentId || "",
    selectedStudentId: student?.studentId || "",
    values: draft.type === "feedback"
      ? { content: draft.payload?.feedback || "" }
      : draft.type === "journal"
        ? {
          content: draft.payload?.content || "",
          type: draft.payload?.type || "observation",
          voiceCaptureType: draft.payload?.voiceCaptureType || null,
        }
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
      && (
        draft.values.type !== "student_reflection"
        || ["direct_quote", "paraphrased"].includes(
          draft.values.voiceCaptureType
        )
      );
  }
  if (draft.type === "score") {
    const score = Number(draft.values.value);
    return Number.isInteger(score)
      && score >= 0
      && score <= 100
      && Boolean(draft.context?.lesson?.id)
      && Boolean(draft.selectedAssignmentId);
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
  if (draft.type === "feedback") {
    return {
      ...common,
      payload: { content: draft.values.content.trim(), observedAt },
    };
  }
  if (draft.type === "journal") {
    return {
      ...common,
      payload: {
        content: draft.values.content.trim(),
        observedAt,
        type: draft.values.type,
        voiceCaptureType: draft.values.type === "student_reflection"
          ? draft.values.voiceCaptureType
          : null,
      },
    };
  }
  if (draft.type === "score") {
    return {
      ...common,
      payload: {
        assignmentId: Number(draft.selectedAssignmentId),
        description: "Classroom Debrief",
        lessonId: Number(draft.context.lesson.id),
        recordedAt: observedAt,
        value: Number(draft.values.value),
      },
    };
  }
  return {
    ...common,
    payload: {
      attendanceDate: localDateValue(),
      status: draft.values.status,
    },
  };
}

function DraftEditor({ draft, onChange }) {
  const studentCandidates = draft.studentResolution?.candidates || [];
  const assessmentCandidates =
    draft.context?.assessmentResolution?.candidates || [];
  const update = (updates) => onChange({ ...draft, ...updates, edited: true });
  const updateValues = (updates) => update({
    values: { ...draft.values, ...updates },
  });
  const saved = ["committed", "duplicate"].includes(draft.result?.status);
  const displayStatus = saved
    ? "Saved"
    : draft.selected
      ? draftReady(draft) ? "Ready" : "Needs clarification"
      : "Discarded";

  return (
    <article className={tw("debrief-draft min-w-0 overflow-hidden rounded-surface border border-issa-border-strong bg-issa-surface")}>
      <header className={tw("flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-issa-border bg-issa-subtle px-4 py-3")}>
        <div className={tw("min-w-0")}>
          <p className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>
            {recordTypeLabels[draft.type] || draft.type}
          </p>
          <h3 className={tw("mt-1 text-section-title font-bold text-issa-text")}>
            {draft.studentResolution?.student?.name
              || draft.studentReference
              || "Siswa perlu dipilih"}
          </h3>
        </div>
        <StatusBadge
          status={displayStatus}
          tone={saved || (draft.selected && draftReady(draft))
            ? "success"
            : draft.selected ? "warning" : "neutral"}
        />
      </header>

      <div className={tw("grid min-w-0 gap-4 p-4")}>
        <p className={tw("text-metadata font-semibold text-issa-muted")}>
          {saved
            ? "Canonical record saved"
            : draft.selected ? "Selected for final confirmation" : "Excluded from confirmation"}
        </p>
        <div className={tw("border-l-emphasis border-issa-accent bg-issa-subtle px-3 py-2")}>
          <p className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Source excerpt</p>
          <blockquote className={tw("mt-1 whitespace-pre-wrap text-supporting text-issa-text")}>
            “{draft.sourceExcerpt}”
          </blockquote>
        </div>

        {draft.selected && studentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Which student?</legend>
            {studentCandidates.map((candidate) => (
              <label className={tw("flex min-w-0 items-center gap-2")} key={candidate.studentId}>
                <input
                  type="radio"
                  name={`${draft.draftId}-student`}
                  checked={Number(draft.selectedStudentId) === candidate.studentId}
                  onChange={() => update({ selectedStudentId: candidate.studentId })}
                />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        {draft.selected && draft.type === "score" && assessmentCandidates.length > 0 && (
          <fieldset className={tw("grid min-w-0 gap-2")}>
            <legend className={tw("text-label font-bold text-issa-text")}>Which assessment?</legend>
            {assessmentCandidates.map((candidate) => (
              <label className={tw("flex min-w-0 items-center gap-2")} key={candidate.assignmentId}>
                <input
                  type="radio"
                  name={`${draft.draftId}-assignment`}
                  checked={Number(draft.selectedAssignmentId) === candidate.assignmentId}
                  onChange={() => update({ selectedAssignmentId: candidate.assignmentId })}
                />
                <span>{candidate.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        {draft.selected && draft.editing && draft.type === "feedback" && (
          <label className={tw("grid min-w-0 gap-1")}>
            <span className={tw("text-label font-semibold")}>Feedback</span>
            <textarea className={tw(controlClasses, "min-h-28 resize-y")} value={draft.values.content} onChange={(event) => updateValues({ content: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.editing && draft.type === "journal" && (
          <div className={tw("grid min-w-0 gap-3")}>
            <label className={tw("grid min-w-0 gap-1")}>
              <span className={tw("text-label font-semibold")}>Journal type</span>
              <select className={tw(controlClasses)} value={draft.values.type} onChange={(event) => updateValues({ type: event.target.value, voiceCaptureType: null })}>
                {journalTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            {draft.values.type === "student_reflection" && (
              <label className={tw("grid min-w-0 gap-1")}>
                <span className={tw("text-label font-semibold")}>Reflection capture</span>
                <select className={tw(controlClasses)} value={draft.values.voiceCaptureType || ""} onChange={(event) => updateValues({ voiceCaptureType: event.target.value || null })}>
                  <option value="">Select capture type</option>
                  <option value="direct_quote">Direct quote</option>
                  <option value="paraphrased">Paraphrased</option>
                </select>
              </label>
            )}
            <label className={tw("grid min-w-0 gap-1")}>
              <span className={tw("text-label font-semibold")}>Journal content</span>
              <textarea className={tw(controlClasses, "min-h-28 resize-y")} value={draft.values.content} onChange={(event) => updateValues({ content: event.target.value })} />
            </label>
          </div>
        )}
        {draft.selected && draft.editing && draft.type === "score" && (
          <label className={tw("grid min-w-0 gap-1")}>
            <span className={tw("text-label font-semibold")}>Score</span>
            <input className={tw(controlClasses)} type="number" min="0" max="100" value={draft.values.value} onChange={(event) => updateValues({ value: event.target.value })} />
          </label>
        )}
        {draft.selected && draft.type === "attendance" && (
          <label className={tw("grid min-w-0 gap-1")}>
            <span className={tw("text-label font-semibold")}>Canonical attendance status</span>
            <select aria-label="Canonical attendance status" className={tw(controlClasses)} value={draft.values.status} onChange={(event) => updateValues({ status: event.target.value })}>
              <option value="">Resolve attendance status</option>
              {attendanceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {draft.payload?.minutesLate && (
              <small className={tw("text-metadata text-issa-muted")}>The canonical attendance record cannot store {draft.payload.minutesLate} minutes late.</small>
            )}
          </label>
        )}

        {draft.selected && !draft.editing && (
          <p className={tw("whitespace-pre-wrap text-body text-issa-text")}>
            {draft.type === "feedback" || draft.type === "journal"
              ? draft.values.content
              : draft.type === "score"
                ? `Score: ${draft.values.value}`
                : `Status: ${draft.values.status || "Needs clarification"}`}
          </p>
        )}

        {draft.result?.status === "failed" && (
          <InlineNotice tone="danger">Save failed: {draft.result.code}</InlineNotice>
        )}
        {draft.result && ["committed", "duplicate"].includes(draft.result.status) && (
          <InlineNotice tone="success">Record saved.</InlineNotice>
        )}

        {!saved && (
          <div className={tw("flex min-w-0 flex-wrap gap-2 max-sm:flex-col max-sm:[&>button]:w-full")}>
            {draft.selected && draft.type !== "attendance" && (
              <SecondaryButton type="button" onClick={() => update({ editing: !draft.editing })}>
                {draft.editing ? "Finish editing" : "Edit"}
              </SecondaryButton>
            )}
            <SecondaryButton type="button" onClick={() => update({ selected: !draft.selected, result: null })}>
              {draft.selected ? "Discard" : "Restore"}
            </SecondaryButton>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ClassroomDebriefWorkspace() {
  const isDemo = isTeacherDemoSession();
  const [text, setText] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [generationState, setGenerationState] = useState({ pending: false, error: "" });
  const [confirmationState, setConfirmationState] = useState({ pending: false, error: "", complete: false });
  const observedAt = useMemo(() => new Date().toISOString(), [drafts.length > 0]);

  useEffect(() => {
    fetchDebriefLessons().then(setLessons).catch(() => setLessons([]));
  }, []);

  const generateDrafts = async (event) => {
    void 'ISSA:CMS.CLASSROOM_DEBRIEF.REVIEW_CONFIRM';
    event.preventDefault();
    const normalizedText = text.trim();
    if (normalizedText.length < 3) {
      setGenerationState({ pending: false, error: "Tell us what happened in class." });
      return;
    }
    setGenerationState({ pending: true, error: "" });
    setConfirmationState({ pending: false, error: "", complete: false });
    try {
      const result = await generateClassroomDebriefDrafts({
        text: normalizedText,
        lessonId,
      });
      setDrafts(result.drafts.map(editableDraft));
    } catch (error) {
      setGenerationState({ pending: false, error: error.message || "Draf belum dapat dibuat." });
      return;
    }
    setGenerationState({ pending: false, error: "" });
  };

  const selectedDrafts = drafts.filter((draft) => draft.selected);
  const readyDrafts = selectedDrafts.filter(draftReady);
  const clarificationCount = selectedDrafts.length - readyDrafts.length;
  const updateDraft = (draftId, updatedDraft) => {
    setDrafts((current) => current.map((draft) => (
      draft.draftId === draftId ? updatedDraft : draft
    )));
  };

  const confirmDrafts = async () => {
    if (isDemo || selectedDrafts.length === 0 || clarificationCount > 0) return;
    setConfirmationState({ pending: true, error: "", complete: false });
    try {
      const response = await confirmClassroomDebriefDrafts(
        selectedDrafts.map((draft) => confirmationItem(draft, observedAt))
      );
      const resultsByDraft = new Map(
        response.results.map((result) => [result.draftId, result])
      );
      const hasFailures = response.results.some((result) => result.status === "failed");
      setDrafts((current) => current.map((draft) => {
        const result = resultsByDraft.get(draft.draftId);
        if (!result) return draft;
        return {
          ...draft,
          result,
          selected: result.status === "failed",
        };
      }));
      setConfirmationState({ pending: false, error: "", complete: !hasFailures });
    } catch (error) {
      setConfirmationState({ pending: false, error: error.message || "Record belum dapat disimpan.", complete: false });
    }
  };

  const savedResults = drafts
    .map((draft) => draft.result)
    .filter((result) => result && ["committed", "duplicate"].includes(result.status));
  const discardedDraftCount = drafts.filter((draft) => (
    !draft.selected
    && !["committed", "duplicate"].includes(draft.result?.status)
  )).length;
  const resetWorkspace = () => {
    setText("");
    setLessonId("");
    setDrafts([]);
    setGenerationState({ pending: false, error: "" });
    setConfirmationState({ pending: false, error: "", complete: false });
  };

  return (
    <PageContainer className={tw("classroom-debrief-workspace min-w-0 text-issa-text")}>
      <PageHeader
        eyebrow="Teacher review instrument"
        title="Classroom Debrief"
        description="Turn one class note into reviewable drafts. Nothing becomes a student record until you confirm it."
      />

      {isDemo && (
        <InlineNotice className={tw("mb-4")} tone="warning">
          Demo mode can generate and review drafts, but cannot save canonical records.
        </InlineNotice>
      )}

      {!drafts.length && (
        <Surface className={tw("overflow-hidden")}>
          <form className={tw("grid min-w-0 gap-5 p-5")} onSubmit={generateDrafts}>
            <label className={tw("grid min-w-0 gap-1")} htmlFor="classroom-debrief-text">
              <span className={tw("text-label font-bold")}>What happened in class?</span>
              <textarea
                aria-label="What happened in class?"
                id="classroom-debrief-text"
                className={tw(controlClasses, "min-h-40 resize-y")}
                maxLength={4000}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Example: Alya worked independently, Rafi arrived late, and Nadia scored 82 on the fraction quiz."
              />
              <small className={tw("text-metadata text-issa-muted")}>{text.length}/4000</small>
            </label>
            <label className={tw("grid min-w-0 gap-1")} htmlFor="classroom-debrief-lesson">
              <span className={tw("text-label font-bold")}>Lesson context (optional)</span>
              <select aria-label="Lesson context (optional)" id="classroom-debrief-lesson" className={tw(controlClasses)} value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
                <option value="">No lesson selected</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
              </select>
            </label>
            {generationState.error && <InlineNotice tone="danger">{generationState.error}</InlineNotice>}
            <div className={tw("flex justify-end max-sm:[&>button]:w-full")}>
              <PrimaryButton type="submit" disabled={generationState.pending}>
                {generationState.pending ? "Generating drafts…" : "Generate drafts"}
              </PrimaryButton>
            </div>
          </form>
        </Surface>
      )}

      {drafts.length > 0 && (
        <div className={tw("grid min-w-0 gap-5")}>
          <Surface className={tw("grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center")}>
            <div>
              <h2 className={tw("text-section-title font-bold")}>{drafts.length} drafts</h2>
              <p className={tw("mt-1 text-supporting text-issa-muted")}>
                {readyDrafts.length} ready · {clarificationCount} needs clarification · {discardedDraftCount} discarded · {savedResults.length} saved
              </p>
            </div>
            <SecondaryButton type="button" onClick={resetWorkspace}>Start another Debrief</SecondaryButton>
          </Surface>

          <div className={tw("grid min-w-0 gap-4 lg:grid-cols-2")}>
            {drafts.map((draft) => (
              <DraftEditor key={draft.draftId} draft={draft} onChange={(updatedDraft) => updateDraft(draft.draftId, updatedDraft)} />
            ))}
          </div>

          {confirmationState.error && <InlineNotice tone="danger">{confirmationState.error}</InlineNotice>}
          {confirmationState.complete && (
            <InlineNotice tone="success">
              {savedResults.length} records saved. Review is complete.
            </InlineNotice>
          )}
          {!confirmationState.complete && savedResults.length > 0 && (
            <InlineNotice tone="warning">
              {savedResults.length} records saved. Failed drafts remain selected for correction and retry.
            </InlineNotice>
          )}
          {isDemo && <InlineNotice tone="warning">{DEMO_READ_ONLY_MESSAGE}</InlineNotice>}

          <Surface className={tw("flex min-w-0 flex-wrap items-center justify-between gap-3 p-4 max-sm:flex-col max-sm:items-stretch")}>
            <p className={tw("text-supporting text-issa-muted")}>
              Confirming saves {selectedDrafts.length} selected draft{selectedDrafts.length === 1 ? "" : "s"}. No AI request is made.
            </p>
            <PrimaryButton
              type="button"
              disabled={isDemo || confirmationState.pending || selectedDrafts.length === 0 || clarificationCount > 0}
              onClick={confirmDrafts}
            >
              {confirmationState.pending ? "Saving records…" : "Confirm selected drafts"}
            </PrimaryButton>
          </Surface>
        </div>
      )}
    </PageContainer>
  );
}

export {
  confirmationItem,
  draftReady,
  editableDraft,
};
