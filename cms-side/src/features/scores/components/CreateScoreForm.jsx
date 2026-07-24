import { useEffect, useMemo, useState } from "react";
import baseUrl from "../../../config/api";
import { PrimaryButton, Surface } from "../../../shared/ui/ui";
import { toIsoDateTime } from "../../../utils/recordDates";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import ComboboxField from "../../../shared/ui/form-controls/ComboboxField";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";
import NumberField from "../../../shared/ui/form-controls/NumberField";

export default function CreateScoreForm({ studentId, onCreated }) {
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
        if (!lessonResponse.ok || !assignmentResponse.ok) throw new Error("Pilihan mata pelajaran atau assessment tidak dapat dimuat.");
        return Promise.all([lessonResponse.json(), assignmentResponse.json()]);
      })
      .then(([lessonData, assignmentData]) => {
        setLessons(Array.isArray(lessonData) ? lessonData : []);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      })
      .catch((error) => setMessage(error.message || "Pilihan score tidak dapat dimuat."))
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

  const handleStudentScoreSubmit = (event) => {
    void 'ISSA:CMS.SCORE.CREATE_STUDENT_SCORE';
    event.preventDefault();
    const scoreValue = Number(form.value);
    if (!form.LessonId || !form.AssignmentId || !Number.isInteger(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      setMessage("Pilih mata pelajaran dan assessment, lalu isi nilai bulat 0–100.");
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
        if (!response.ok) throw new Error(data.msg || "Score gagal dibuat.");
        return data;
      })
      .then(() => {
        setForm({ LessonId: "", AssignmentId: "", value: "", recordedAt: "" });
        setMessage("Score berhasil dibuat.");
        onCreated();
      })
      .catch((error) => setMessage(error.message || "Score gagal dibuat."))
      .finally(() => setSubmitting(false));
  };

  return (
    <Surface className="score-entry-ledger">
      <div className="score-entry-ledger__header"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#745594]">Entry register</p><h2 className="mt-1 font-semibold text-[var(--text)]">Catat nilai</h2><p className="mt-1 text-sm text-[var(--muted)]">Pilih satu assessment untuk siswa ini.</p></div>
      <form onSubmit={handleStudentScoreSubmit} className="score-entry-ledger__form">
        <div className="score-entry-ledger__context">
        <SelectField id="score-lesson" label="Mata pelajaran" required disabled={loadingOptions} value={form.LessonId} onChange={(LessonId) => setForm({ ...form, LessonId })} options={lessonOptions} placeholder={loadingOptions ? "Memuat..." : "Pilih mata pelajaran"} tone="score" />
        <ComboboxField id="score-assignment" label="Assessment" required disabled={loadingOptions} value={form.AssignmentId} onChange={(AssignmentId) => setForm({ ...form, AssignmentId })} options={assignmentOptions} placeholder={loadingOptions ? "Memuat..." : "Cari assessment"} tone="score" />
        <div className="score-entry-ledger__threshold" aria-live="polite"><span>Reference threshold</span><strong>{selectedLesson?.KKM != null ? `KKM ${selectedLesson.KKM}` : "KKM —"}</strong><small>{selectedLesson?.KKM != null ? "Ambang mata pelajaran terpilih" : "Pilih mata pelajaran terlebih dahulu"}</small></div>
        </div>
        <div className="score-entry-ledger__input-area">
        <NumberField id="student-score" label="Nilai siswa" required min="0" max="100" step="1" value={form.value} onChange={(value) => setForm({ ...form, value })} className="issa-control-tone--score score-entry-ledger__score-field" />
        <DateTimeField id="score-recorded-at" label="Tanggal pencatatan" value={form.recordedAt} onChange={(recordedAt) => setForm({ ...form, recordedAt })} optional tone="score" />
        <div className="score-entry-ledger__submit"><PrimaryButton type="submit" disabled={loadingOptions || submitting}>{submitting ? "Menyimpan..." : "Simpan score"}</PrimaryButton></div>
        </div>
      </form>
      {message && <p role="status" className={`score-entry-ledger__message text-sm ${message.includes("berhasil") ? "text-emerald-700" : "text-rose-700"}`}>{message}</p>}
    </Surface>
  );
}
