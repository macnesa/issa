import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import baseUrl from "../config/api";
import { editStudent, studentById } from "../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../utils/recordDates";
import { EmptyState, ErrorState, FormField, LoadingState, PageContainer, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, Surface } from "../components/ui";

export default function StudentDetail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);
  const [feedback, setFeedback] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState({ loading: true, error: "", data: [] });

  const loadFeedbackHistory = useCallback(() => {
    setFeedbackHistory((current) => ({ ...current, loading: true, error: "" }));
    return fetch(`${baseUrl}/students/${studentId}/feedbacks`, { headers: { access_token: localStorage.access_token } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.msg || "Histori feedback gagal dimuat."); return data; })
      .then((data) => {
        const sorted = Array.isArray(data) ? [...data].sort((left, right) => {
          const leftTime = new Date(left.observedAt || left.createdAt || 0).getTime();
          const rightTime = new Date(right.observedAt || right.createdAt || 0).getTime();
          return rightTime - leftTime;
        }) : [];
        setFeedbackHistory({ loading: false, error: "", data: sorted });
      })
      .catch((error) => setFeedbackHistory({ loading: false, error: error.message || "Histori feedback gagal dimuat.", data: [] }));
  }, [studentId]);

  useEffect(() => {
    setDetailLoading(true);
    setDetailError("");
    dispatch(studentById(studentId))
      .catch((error) => setDetailError(error.message || "Student tidak ditemukan."))
      .finally(() => setDetailLoading(false));
    loadFeedbackHistory();
  }, [dispatch, loadFeedbackHistory, studentId]);

  useEffect(() => { setFeedback(student?.feedback || ""); }, [student]);

  const submitForm = (event) => {
    event.preventDefault();
    const content = feedback.trim();
    if (!content) return setMessage("Feedback tidak boleh kosong.");
    const payload = { feedback: content };
    const normalizedObservedAt = toIsoDateTime(observedAt);
    if (observedAt && !normalizedObservedAt) return setMessage("Tanggal observasi tidak valid.");
    if (normalizedObservedAt) payload.observedAt = normalizedObservedAt;
    setSubmitting(true); setMessage("");
    dispatch(editStudent(studentId, payload)).then(() => { setObservedAt(""); setMessage("Feedback berhasil diperbarui."); return loadFeedbackHistory(); }).catch((error) => setMessage(error.message || "Feedback gagal diperbarui.")).finally(() => setSubmitting(false));
  };

  if (detailLoading) return <PageContainer><LoadingState label="Memuat detail siswa..." /></PageContainer>;
  if (detailError) return <PageContainer><Surface className="p-5"><ErrorState message={detailError} /><SecondaryButton className="mt-4" type="button" onClick={() => navigate("/")}>Kembali ke dashboard</SecondaryButton></Surface></PageContainer>;

  const attendances = [...(student?.Attendances || [])].sort((left, right) => String(right.attendanceDate || "").localeCompare(String(left.attendanceDate || "")));
  const scores = student?.Scores || [];
  const scoreStatus = (status) => (status === true ? "Lulus" : status === false ? "Belum lulus" : undefined);
  return <PageContainer>
    <PageHeader eyebrow="Student record" title={student?.name || "Detail siswa"} description={`NIM ${student?.NIM || "-"} · ${student?.Class?.name || "Kelas Anda"}`} actions={<><SecondaryButton type="button" onClick={() => navigate("/")}>Kembali</SecondaryButton><Link to="/attendance"><PrimaryButton type="button">Catat attendance</PrimaryButton></Link></>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
      <div className="space-y-6">
        <Surface className="overflow-hidden"><div className="flex flex-col gap-4 bg-slate-50 p-5 sm:flex-row sm:items-center"><img className="h-16 w-16 rounded-2xl border border-[var(--border)] object-cover" src={student?.imgUrl} alt={student?.name || "Siswa"} /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Identitas siswa</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)]">{student?.name || "Memuat siswa..."}</h2><p className="mt-1 text-sm text-[var(--muted)]">NIM {student?.NIM || "-"} · {student?.Class?.name || "Kelas Anda"}</p></div></div></Surface>
        <Surface className="p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Feedback terbaru</h2><p className="mt-3 whitespace-pre-wrap leading-6 text-[var(--text)]">{student?.feedback || "Belum ada feedback."}</p></Surface>
        <Surface className="p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Catat feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Tambahkan catatan terbaru untuk rekam perkembangan siswa.</p><form onSubmit={submitForm} className="mt-5 space-y-4"><FormField label="Feedback"><textarea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} className="min-h-32 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" rows="5" /></FormField><FormField label="Tanggal observasi" hint="Opsional"><input id="observedAt" type="datetime-local" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} onInput={(event) => setObservedAt(event.target.value)} className="min-h-10 w-full rounded-lg border border-[var(--border-strong)] px-3 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" /></FormField><div className="flex flex-wrap items-center gap-3"><PrimaryButton type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan feedback"}</PrimaryButton>{message && <p role="status" className="text-sm text-[var(--muted)]">{message}</p>}</div></form></Surface>
        <Surface className="p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Histori feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Catatan terbaru ditampilkan lebih dahulu.</p><div className="mt-4">{feedbackHistory.loading && <LoadingState label="Memuat histori feedback..." />}{feedbackHistory.error && <ErrorState message={feedbackHistory.error} onRetry={loadFeedbackHistory} />}{!feedbackHistory.loading && !feedbackHistory.error && feedbackHistory.data.length === 0 && <EmptyState title="Belum ada histori feedback." />}{!feedbackHistory.loading && !feedbackHistory.error && feedbackHistory.data.length > 0 && <ol className="space-y-3">{feedbackHistory.data.map((item) => <li key={item.id} className="rounded-xl border border-[var(--border)] p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{item.content}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]"><span>Guru: {item.Teacher?.name || "-"}</span><span>Observasi: {formatRecordedDate(item.observedAt, "Belum tersedia")}</span><span>Dibuat: {formatRecordedDate(item.createdAt)}</span></div></li>)}</ol>}</div></Surface>
      </div>
      <div className="space-y-6">
        <Surface className="p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--text)]">Attendance record</h2><p className="mt-1 text-sm text-[var(--muted)]">Tanggal kejadian dan status siswa.</p></div><Link to="/attendance"><SecondaryButton type="button">Kelola</SecondaryButton></Link></div><div className="mt-4 space-y-3">{attendances.length === 0 && <EmptyState title="Belum ada attendance" />}{attendances.map((attendance) => <div key={attendance.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3"><span className="text-sm font-medium text-[var(--text)]">{attendance.attendanceDate || "Tanggal attendance belum tersedia"}</span><StatusBadge status={attendance.status} /></div>)}</div></Surface>
        <Surface className="p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--text)]">Score record</h2><p className="mt-1 text-sm text-[var(--muted)]">Nilai dan KKM per assessment.</p></div><Link to={`/scores/${studentId}`}><SecondaryButton type="button">Kelola</SecondaryButton></Link></div><div className="mt-4 space-y-3">{scores.length === 0 && <EmptyState title="Belum ada score" />}{scores.map((score) => <div key={score.id} className="rounded-xl border border-[var(--border)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[var(--text)]">{score.Lesson?.name || "Lesson"}</p><p className="mt-1 text-xs text-[var(--muted)]">{score.Assignment?.name || "Assessment"} · KKM {score.Lesson?.KKM ?? "-"}</p></div><div className="text-right"><p className="text-lg font-semibold text-[var(--text)]">{score.value}</p><StatusBadge status={scoreStatus(score.status)} /></div></div><p className="mt-3 text-xs text-[var(--muted)]">{formatRecordedDate(score.recordedAt)}</p></div>)}</div></Surface>
      </div>
    </div>
  </PageContainer>;
}
