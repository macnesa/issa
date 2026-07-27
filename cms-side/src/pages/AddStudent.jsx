import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import baseUrl from "../config/api";
import FeedbackForm from "../features/feedback/components/FeedbackForm";
import FeedbackHistory from "../features/feedback/components/FeedbackHistory";
import StudentEvidenceSection from "../features/student-evidence/components/StudentEvidenceSection";
import StudentLearningJournalSection from "../features/student-learning-journal/components/StudentLearningJournalSection";
import {
  fetchStudentDetail,
  storeStudentDetail,
  updateStudentRecord,
} from "../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../utils/recordDates";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, Surface } from "../shared/ui/ui";
import { useOfflineWorkspace } from "../offline-workspace/OfflineWorkspaceProvider";
import { loadStudentDetailWorkspace } from "../offline-workspace/studentDetailSnapshot";
import {
  mergeWorkspaceSnapshot,
} from "../offline-workspace/workspaceSnapshots";
import {
  useAttendanceOfflineRecords,
} from "../offline-workspace/attendanceOffline";
import AttendanceRecordEditor from "../features/attendance/components/AttendanceRecordEditor";
import AiNarrativeWorkspace from "../features/ai-learning-narrative/AiNarrativeWorkspace";
import "../features/students/student-record.css";

function formatCachedAt(timestamp) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function StudentDetail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { teacherIdentity, onlineHint } = useOfflineWorkspace();
  const student = useSelector((state) => state.students.student);
  const [feedback, setFeedback] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState({ loading: true, error: "", data: [] });
  const [journalRefreshKey, setJournalRefreshKey] = useState(0);
  const [cachedSnapshot, setCachedSnapshot] = useState(null);
  const [usingCachedSnapshot, setUsingCachedSnapshot] = useState(false);
  const [aiWorkspaceOpen, setAiWorkspaceOpen] = useState(false);
  const feedbackInputRef = useRef(null);
  const serverAttendances = useMemo(() => orderBy(
    student?.Attendances || [],
    [(item) => String(item.attendanceDate || "")],
    ["desc"]
  ), [student?.Attendances]);
  const attendanceWorkspace = useAttendanceOfflineRecords({
    teacherId: teacherIdentity?.id,
    studentId,
    serverRecords: serverAttendances,
  });

  const fetchStudentFeedbackHistory = useCallback(() => {
    void 'ISSA:CMS.FEEDBACK.FETCH_HISTORY';
    setFeedbackHistory((current) => ({ ...current, loading: true, error: "" }));
    return fetch(`${baseUrl}/students/${studentId}/feedbacks`, { headers: { access_token: localStorage.access_token } })
      .then(async (response) => { const feedbackHistoryResponse = await response.json(); if (!response.ok) throw new Error(feedbackHistoryResponse.msg || "Histori feedback gagal dimuat."); return feedbackHistoryResponse; })
      .then((feedbackHistoryResponse) => {
        const feedbackHistoryByNewest = Array.isArray(feedbackHistoryResponse) ? orderBy(feedbackHistoryResponse, [
          (teacherFeedback) => new Date(teacherFeedback.observedAt || teacherFeedback.createdAt || 0).getTime(),
        ], ['desc']) : [];
        setFeedbackHistory({ loading: false, error: "", data: feedbackHistoryByNewest });
      })
      .catch((error) => setFeedbackHistory({ loading: false, error: error.message || "Histori feedback gagal dimuat.", data: [] }));
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    setUsingCachedSnapshot(false);

    loadStudentDetailWorkspace({
      teacherId: teacherIdentity?.id,
      studentId,
      onlineHint,
      fetchStudent: () => dispatch(fetchStudentDetail(studentId)),
    })
      .then((workspace) => {
        if (cancelled) return;
        setCachedSnapshot(workspace.snapshot);
        setUsingCachedSnapshot(workspace.source === "snapshot");
        if (workspace.source === "snapshot") {
          dispatch(storeStudentDetail(workspace.student));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setDetailError(error.message || "Student tidak ditemukan.");
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    fetchStudentFeedbackHistory();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    fetchStudentFeedbackHistory,
    onlineHint,
    studentId,
    teacherIdentity?.id,
  ]);

  useEffect(() => { setFeedback(student?.feedback || ""); }, [student]);

  const handleStudentFeedbackSubmit = (event) => {
    void 'ISSA:CMS.FEEDBACK.SUBMIT_STUDENT_FEEDBACK';
    event.preventDefault();
    const content = feedback.trim();
    if (!content) return setMessage("Feedback tidak boleh kosong.");
    const payload = { feedback: content };
    const normalizedObservedAt = toIsoDateTime(observedAt);
    if (observedAt && !normalizedObservedAt) return setMessage("Tanggal observasi tidak valid.");
    if (normalizedObservedAt) payload.observedAt = normalizedObservedAt;
    setSubmitting(true); setMessage("");
    dispatch(updateStudentRecord(studentId, payload)).then(() => { setObservedAt(""); setMessage("Feedback berhasil diperbarui."); return fetchStudentFeedbackHistory(); }).catch((error) => setMessage(error.message || "Feedback gagal diperbarui.")).finally(() => setSubmitting(false));
  };

  const handleJournalLoaded = useCallback((entries) => {
    if (!teacherIdentity?.id) return;
    return mergeWorkspaceSnapshot({
      teacherId: teacherIdentity.id,
      studentId,
      journalEntries: entries,
    })
      .then((snapshot) => setCachedSnapshot(snapshot))
      .catch(() => {});
  }, [studentId, teacherIdentity?.id]);

  const handleAiDraftHandoff = useCallback((draftText) => {
    setFeedback(draftText);
    setMessage("Draf telah dipindahkan ke Feedback. Periksa kembali lalu simpan untuk membagikannya kepada orang tua.");
    window.requestAnimationFrame(() => {
      feedbackInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      feedbackInputRef.current?.focus();
    });
  }, []);

  if (detailLoading) return <PageContainer><LoadingState label="Memuat detail siswa..." /></PageContainer>;
  if (detailError) return <PageContainer><Surface className="p-5"><ErrorState message={detailError} /><SecondaryButton className="mt-4" type="button" onClick={() => navigate("/")}>Kembali ke dashboard</SecondaryButton></Surface></PageContainer>;

  const attendances = orderBy(
    attendanceWorkspace.records,
    [(item) => String(item.attendanceDate || "")],
    ["desc"]
  );
  const scores = student?.Scores || [];
  const scoreStatus = (status) => (status === true ? "Lulus" : status === false ? "Belum lulus" : undefined);
  return <PageContainer className="student-case-file">
    <PageHeader eyebrow="Student record" title={student?.name || "Detail siswa"} description={`NIM ${student?.NIM || "-"} · ${student?.Class?.name || "Kelas Anda"}`} actions={<><SecondaryButton type="button" onClick={() => navigate("/")}>Kembali</SecondaryButton>{usingCachedSnapshot ? <PrimaryButton type="button" disabled>Tambah attendance perlu online</PrimaryButton> : <Link to="/attendance"><PrimaryButton type="button">Catat attendance</PrimaryButton></Link>}</>} />
    {usingCachedSnapshot && (
      <div className="student-case-file__offline-note" role="status">
        <strong>Workspace tersimpan</strong>
        <span>Data tersimpan dari {formatCachedAt(cachedSnapshot?.cachedAt)}. Hubungkan kembali untuk memperoleh data terbaru.</span>
      </div>
    )}
    <div className="student-case-file__grid grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
      <div className="space-y-6">
        <Surface className="student-dossier overflow-hidden"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">{student?.imgUrl ? <img className="student-dossier__image h-16 w-16 object-cover" src={student.imgUrl} alt={student?.name || "Siswa"} /> : <div className="student-dossier__image student-dossier__initials grid h-16 w-16 place-items-center" aria-hidden="true">{(student?.name || "S").slice(0, 1).toUpperCase()}</div>}<div className="relative z-10"><p className="student-dossier__eyebrow text-xs font-semibold uppercase tracking-[0.14em]">Identitas siswa</p><h2 className="student-dossier__title mt-1 text-xl font-semibold">{student?.name || "Memuat siswa..."}</h2><p className="student-dossier__meta mt-1 text-sm">NIM {student?.NIM || "-"} · {student?.Class?.name || "Kelas Anda"}</p></div></div></Surface>
        <section className="student-current-state" aria-label="Status record siswa"><div><span>Attendance record</span><strong>{attendances.length ? `${attendances.length} tercatat` : "Belum ada"}</strong></div><div><span>Score record</span><strong>{scores.length ? `${scores.length} tercatat` : "Belum ada"}</strong></div></section>
        {usingCachedSnapshot ? <Surface className="p-5"><EmptyState title="Feedback memerlukan koneksi" description="Feedback tidak disimpan dalam workspace offline minimum." /></Surface> : <><Surface className="observation-sheet p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Feedback terbaru</h2><p className="mt-3 whitespace-pre-wrap leading-6 text-[var(--text)]">{student?.feedback || "Belum ada feedback."}</p></Surface><FeedbackForm feedback={feedback} feedbackInputRef={feedbackInputRef} observedAt={observedAt} message={message} submitting={submitting} onAiDraftRequested={() => setAiWorkspaceOpen(true)} onFeedbackChange={(event) => setFeedback(event.target.value)} onObservedAtChange={setObservedAt} onSubmit={handleStudentFeedbackSubmit} /><FeedbackHistory resource={feedbackHistory} onRetry={fetchStudentFeedbackHistory} /><StudentEvidenceSection studentId={studentId} onEvidenceChanged={() => { setJournalRefreshKey((current) => current + 1); }} /></>}
        <StudentLearningJournalSection
          studentId={studentId}
          refreshKey={journalRefreshKey}
          cachedEntries={cachedSnapshot?.journalEntries || []}
          hasCachedSnapshot={Boolean(cachedSnapshot)}
          offlineReadOnly={usingCachedSnapshot}
          onJournalLoaded={handleJournalLoaded}
        />
      </div>
      <div className="space-y-6">
        <Surface className="record-ledger record-ledger--attendance p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Attendance record</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Perbarui record yang sudah ada. Attendance baru tetap memerlukan koneksi.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {isEmpty(attendances) && <EmptyState title="Belum ada attendance" />}
            {attendances.map((attendance) => (
              <AttendanceRecordEditor
                key={attendance.id}
                record={attendance}
                saving={attendanceWorkspace.savingEntityKey === attendance.entityKey}
                onChange={(record, status) => {
                  attendanceWorkspace.updateAttendance(record, status)
                    .catch(() => {});
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]" aria-live="polite">
            {attendanceWorkspace.message}
          </p>
        </Surface>
        {usingCachedSnapshot ? <Surface className="record-ledger record-ledger--score p-5"><EmptyState title="Score memerlukan koneksi" description="Score tidak disimpan dalam workspace offline minimum." /></Surface> : <Surface className="record-ledger record-ledger--score p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--text)]">Score record</h2><p className="mt-1 text-sm text-[var(--muted)]">Nilai dan KKM per assessment.</p></div><Link to={`/scores/${studentId}`}><SecondaryButton type="button">Kelola</SecondaryButton></Link></div><div className="mt-4 space-y-3">{isEmpty(scores) && <EmptyState title="Belum ada score" />}{scores.map((score) => <div key={score.id} className="record-ledger__entry rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[var(--text)]">{score.Lesson?.name || "Lesson"}</p><p className="mt-1 text-xs text-[var(--muted)]">{score.Assignment?.name || "Assessment"} · KKM {score.Lesson?.KKM ?? "-"}</p></div><div className="text-right"><p className="text-lg font-semibold text-[var(--text)]">{score.value}</p><StatusBadge status={scoreStatus(score.status)} /></div></div><p className="mt-3 text-xs text-[var(--muted)]">{formatRecordedDate(score.recordedAt)}</p></div>)}</div></Surface>}
      </div>
    </div>
    <AiNarrativeWorkspace
      open={aiWorkspaceOpen}
      studentId={studentId}
      existingFeedback={feedback}
      onClose={() => setAiWorkspaceOpen(false)}
      onUseFeedback={handleAiDraftHandoff}
    />
  </PageContainer>;
}
