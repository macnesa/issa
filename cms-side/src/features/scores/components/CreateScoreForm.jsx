import { useEffect, useMemo, useState } from "react";
import baseUrl from "../../../config/api";
import { FormField, PrimaryButton, Surface } from "../../../shared/ui/ui";
import { toIsoDateTime } from "../../../utils/recordDates";

const inputClassName = "w-full rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--focus)]";

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
    <Surface className="p-5">
      <div className="mb-4"><h2 className="font-semibold text-[var(--text)]">Catat score</h2><p className="mt-1 text-sm text-[var(--muted)]">Pilih satu assessment untuk siswa ini.</p></div>
      <form onSubmit={handleStudentScoreSubmit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FormField label="Mata pelajaran">
          <select required disabled={loadingOptions} value={form.LessonId} onChange={(event) => setForm({ ...form, LessonId: event.target.value })} className={inputClassName}>
            <option value="">{loadingOptions ? "Memuat..." : "Pilih mata pelajaran"}</option>
            {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
          </select>
        </FormField>
        <FormField label="Assessment">
          <select required disabled={loadingOptions} value={form.AssignmentId} onChange={(event) => setForm({ ...form, AssignmentId: event.target.value })} className={inputClassName}>
            <option value="">{loadingOptions ? "Memuat..." : "Pilih assessment"}</option>
            {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.name}</option>)}
          </select>
        </FormField>
        <FormField label="Nilai" hint={selectedLesson?.KKM != null ? `KKM: ${selectedLesson.KKM}` : "Pilih mata pelajaran untuk melihat KKM."}>
          <input required min="0" max="100" step="1" type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className={inputClassName} />
        </FormField>
        <FormField label="Tanggal pencatatan" hint="Opsional">
          <input type="datetime-local" value={form.recordedAt} onChange={(event) => setForm({ ...form, recordedAt: event.target.value })} className={inputClassName} />
        </FormField>
        <div className="sm:col-span-2 xl:col-span-4"><PrimaryButton type="submit" disabled={loadingOptions || submitting}>{submitting ? "Menyimpan..." : "Simpan score"}</PrimaryButton></div>
      </form>
      {message && <p role="status" className={`mt-3 text-sm ${message.includes("berhasil") ? "text-emerald-700" : "text-rose-700"}`}>{message}</p>}
    </Surface>
  );
}
