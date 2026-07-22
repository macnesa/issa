import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import TableScores from "../components/TableScores";
import baseUrl from "../config/api";
import { studentById } from "../store/action/ActionCreator";
import { toIsoDateTime } from "../utils/recordDates";
import {
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryButton,
  Surface,
} from "../components/ui";

const inputClassName = "w-full rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--focus)]";

function CreateScoreForm({ studentId, onCreated }) {
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

  const submit = (event) => {
    event.preventDefault();
    const value = Number(form.value);
    if (!form.LessonId || !form.AssignmentId || !Number.isInteger(value) || value < 0 || value > 100) {
      setMessage("Pilih mata pelajaran dan assessment, lalu isi nilai bulat 0–100.");
      return;
    }

    const normalizedRecordedAt = toIsoDateTime(form.recordedAt);
    if (form.recordedAt && !normalizedRecordedAt) {
      setMessage("Tanggal pencatatan tidak valid.");
      return;
    }

    const payload = { StudentId: Number(studentId), LessonId: Number(form.LessonId), AssignmentId: Number(form.AssignmentId), value };
    if (normalizedRecordedAt) payload.recordedAt = normalizedRecordedAt;

    setMessage("");
    setSubmitting(true);
    fetch(`${baseUrl}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: localStorage.access_token },
      body: JSON.stringify(payload),
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
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

export default function Scores() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);

  const refreshStudent = useCallback(() => {
    setError("");
    setLoading(true);
    return dispatch(studentById(studentId))
      .catch((requestError) => setError(requestError?.message || "Data siswa tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch, studentId]);

  useEffect(() => { refreshStudent(); }, [refreshStudent]);

  if (loading) return <PageContainer><LoadingState label="Memuat record score..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={refreshStudent} /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader eyebrow="Record siswa" title="Score siswa" description={student?.name ? `Kelola record akademik ${student.name}.` : "Kelola record akademik siswa."} actions={<Link to={`/students/${studentId}`} className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50">Kembali ke detail</Link>} />
      {!student?.id ? <EmptyState title="Siswa tidak ditemukan" description="Siswa ini tidak tersedia pada kelas Anda." /> : <div className="space-y-5"><CreateScoreForm studentId={student.id} onCreated={refreshStudent} /><Surface className="overflow-hidden"><div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-semibold text-[var(--text)]">Riwayat score</h2><p className="mt-1 text-sm text-[var(--muted)]">Status berasal dari backend berdasarkan KKM mata pelajaran.</p></div>{student.Scores?.length ? <div className="overflow-x-auto"><table className="min-w-[860px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"><tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Pelajaran</th><th className="px-4 py-3">KKM</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody>{student.Scores.map((score) => <TableScores key={score.id} data={score} student={student} />)}</tbody></table></div> : <div className="p-5"><EmptyState title="Belum ada score" description="Catat assessment pertama untuk menampilkan record akademik." /></div>}</Surface></div>}
    </PageContainer>
  );
}
