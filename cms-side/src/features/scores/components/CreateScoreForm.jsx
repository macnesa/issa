import { tw } from "../../../shared/ui/tw";
import { useEffect, useMemo, useState } from "react";
import baseUrl from "../../../config/api";
import {
  InlineNotice,
  LedgerShell,
  PrimaryButton,
  Surface,
} from "../../../shared/ui/ui";
import { toIsoDateTime } from "../../../utils/recordDates";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import ComboboxField from "../../../shared/ui/form-controls/ComboboxField";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";
import NumberField from "../../../shared/ui/form-controls/NumberField";
import { useOfflineWorkspace } from "../../../offline-workspace/OfflineWorkspaceProvider";
import {
  assertTeacherMutationAllowed,
  readApiError,
} from "../../../auth/demoAccess";

export default function CreateScoreForm({ studentId, onCreated }) {
  const { isDemo } = useOfflineWorkspace();
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ LessonId: "", AssignmentId: "", value: "", recordedAt: "" });
  const [message, setMessage] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const headers = { access_token: localStorage.access_token };
    Promise.all([fetch(`${baseUrl}/lessons`, { headers }), fetch(`${baseUrl}/assignments`, { headers })])
      .then(async ([lessonResponse, assignmentResponse]) => {
        if (!lessonResponse.ok || !assignmentResponse.ok) throw new Error("Pilihan mata pelajaran atau penilaian tidak dapat dimuat.");
        return Promise.all([lessonResponse.json(), assignmentResponse.json()]);
      })
      .then(([lessonData, assignmentData]) => {
        setLessons(Array.isArray(lessonData) ? lessonData : []);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      })
      .catch((error) => setMessage(error.message || "Pilihan nilai tidak dapat dimuat."))
      .finally(() => setLoadingOptions(false));
  }, []);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => String(lesson.id) === form.LessonId),
    [form.LessonId, lessons],
  );
  const lessonOptions = useMemo(
    () => lessons.map((lesson) => ({ value: String(lesson.id), label: lesson.name })),
    [lessons],
  );
  const assignmentOptions = useMemo(
    () => assignments.map((assignment) => ({ value: String(assignment.id), label: assignment.name })),
    [assignments],
  );
  const dependencyMessage = loadingOptions
    ? "Pilihan mata pelajaran dan penilaian sedang dimuat."
    : !form.LessonId
      ? "Pilih mata pelajaran terlebih dahulu."
      : !form.AssignmentId
        ? "Pilih penilaian untuk melanjutkan."
        : "";
  const submitDisabled = loadingOptions
    || submitting
    || isDemo
    || !form.LessonId
    || !form.AssignmentId;

  const handleStudentScoreSubmit = (event) => {
    void 'ISSA:CMS.SCORE.CREATE_STUDENT_SCORE';
    event.preventDefault();
    if (isDemo) {
      setMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }
    assertTeacherMutationAllowed();
    const scoreValue = Number(form.value);
    if (!form.LessonId || !form.AssignmentId || !Number.isInteger(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      setMessage("Pilih mata pelajaran dan penilaian, lalu isi nilai bulat 0–100.");
      return;
    }

    const normalizedRecordedAt = toIsoDateTime(form.recordedAt);
    if (form.recordedAt && !normalizedRecordedAt) {
      setMessage("Tanggal pencatatan tidak valid.");
      return;
    }

    const scorePayload = { StudentId: Number(studentId), LessonId: Number(form.LessonId), AssignmentId: Number(form.AssignmentId), value: scoreValue };
    if (normalizedRecordedAt) scorePayload.recordedAt = normalizedRecordedAt;

    setMessage("");
    setSubmitting(true);
    fetch(`${baseUrl}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: localStorage.access_token },
      body: JSON.stringify(scorePayload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const apiError = readApiError(
            data,
            "Nilai gagal disimpan.",
            response.status
          );
          const error = new Error(apiError.message);
          error.status = response.status;
          error.code = apiError.code;
          throw error;
        }
        return data;
      })
      .then(() => {
        setForm({ LessonId: "", AssignmentId: "", value: "", recordedAt: "" });
        setMessage("Nilai berhasil disimpan.");
        onCreated();
      })
      .catch((error) => setMessage(error.message || "Nilai gagal disimpan."))
      .finally(() => setSubmitting(false));
  };

  return (
    <LedgerShell
      className={tw("score-entry-ledger")}
      eyebrow="Rekam akademik"
      title="Catat nilai"
      description="Pilih mata pelajaran dan penilaian yang sesuai."
    >
      <form onSubmit={handleStudentScoreSubmit} className={tw("score-entry-ledger__form p-4 max-sm:p-4")}>
        <div className={tw("score-entry-ledger__fields grid gap-4 lg:[grid-template-columns:repeat(12,_minmax(0,_1fr))] lg:[align-items:end]")}>
          <SelectField
            id="score-lesson"
            label="Mata pelajaran"
            required
            disabled={loadingOptions || isDemo}
            value={form.LessonId}
            onChange={(LessonId) => setForm({ ...form, LessonId })}
            options={lessonOptions}
            placeholder={loadingOptions ? "Memuat..." : "Pilih mata pelajaran"}
            className={tw("score-entry-ledger__lesson lg:col-span-6")}
          />
          <ComboboxField
            id="score-assignment"
            label="Penilaian"
            required
            disabled={loadingOptions || isDemo}
            value={form.AssignmentId}
            onChange={(AssignmentId) => setForm({ ...form, AssignmentId })}
            options={assignmentOptions}
            placeholder={loadingOptions ? "Memuat..." : "Cari penilaian"}
            className={tw("score-entry-ledger__assessment lg:col-span-6")}
          />
          <Surface
            as="div"
            variant="subtle"
            className={tw("score-entry-ledger__threshold flex [min-height:4rem] flex-col justify-center py-2 px-3 lg:col-span-3")}
            aria-live="polite"
          >
            <span className={tw("text-issa-muted text-metadata font-bold tracking-metadata uppercase")}>Ambang ketuntasan</span>
            <strong className={tw("mt-1 text-issa-text text-section-title leading-tight")}>{selectedLesson?.KKM != null ? selectedLesson.KKM : "—"}</strong>
            <small className={tw("mt-1 text-issa-muted text-metadata")}>
              {selectedLesson?.KKM != null
                ? "KKM mata pelajaran terpilih"
                : "Pilih mata pelajaran"}
            </small>
          </Surface>
          <NumberField
            id="student-score"
            label="Nilai siswa"
            required
            min="0"
            max="100"
            step="1"
            value={form.value}
            disabled={isDemo}
            onChange={(value) => setForm({ ...form, value })}
            helperText={selectedLesson?.KKM != null
              ? `Rentang 0–100. Ketuntasan mulai ${selectedLesson.KKM}.`
              : "Masukkan angka bulat 0–100."}
            className={tw("score-entry-ledger__score-field lg:col-span-3")}
          />
          <DateTimeField
            id="score-recorded-at"
            label="Tanggal pencatatan"
            value={form.recordedAt}
            disabled={isDemo}
            onChange={(recordedAt) => setForm({ ...form, recordedAt })}
            optional
            className={tw("score-entry-ledger__date-field lg:[grid-column:span_4]")}
          />
          <div className={tw("score-entry-ledger__submit flex min-w-0 flex-col [align-self:end] gap-1 lg:[grid-column:1_/_-1] [&>.issa-button]:w-full [&_p]:m-0 [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:leading-normal")}>
            <PrimaryButton
              type="submit"
              disabled={submitDisabled}
              aria-describedby={dependencyMessage ? "score-submit-dependency" : undefined}
            >
              {submitting ? "Menyimpan..." : "Simpan nilai"}
            </PrimaryButton>
            {dependencyMessage && (
              <p id="score-submit-dependency" aria-live="polite">
                {dependencyMessage}
              </p>
            )}
            {isDemo && (
              <p>Tidak tersedia dalam mode demo.</p>
            )}
          </div>
        </div>
      </form>
      {message && (
        <InlineNotice
          className={tw("score-entry-ledger__message [margin:0_var(--issa-space-4)_var(--issa-space-4)] max-sm:[margin:0_var(--issa-space-4)_var(--issa-space-4)]")}
          tone={message.includes("berhasil") ? "success" : "danger"}
        >
          {message}
        </InlineNotice>
      )}
    </LedgerShell>
  );
}
