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
  fetchStudentList,
  storeStudentDetail,
  updateStudentRecord,
} from "../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../utils/recordDates";
import { EmptyState, ErrorState, LoadingState, PageContainer, PrimaryButton, SecondaryButton, StatusBadge, Surface } from "../shared/ui/ui";
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
import { getAuthorizedClassName } from "../features/students/authorizedClass";
import { DEMO_READ_ONLY_MESSAGE } from "../auth/demoAccess";
import "../features/students/student-record.css";

const recordSurfaceClasses = [
  "min-w-0 overflow-hidden !border-2 !border-[var(--border-strong)]",
  "!rounded-[0.25rem] !bg-[#fffdf7] !shadow-none",
].join(" ");

const unavailableSurfaceClasses = [
  "min-w-0 !border-2 !border-[var(--border-strong)]",
  "!rounded-[0.25rem] !bg-[#fffdf7] p-5 !shadow-none",
].join(" ");

const workspaceViews = Object.freeze([
  { id: "summary", label: "Ringkasan" },
  { id: "attendance", label: "Kehadiran" },
  { id: "scores", label: "Nilai" },
  { id: "journal-evidence", label: "Jurnal & Bukti" },
  { id: "feedback", label: "Feedback" },
]);

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
  const { isDemo, teacherIdentity, onlineHint } = useOfflineWorkspace();
  const student = useSelector((state) => state.students.student);
  const studentList = useSelector((state) => state.students.students);
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
  const [activeWorkspace, setActiveWorkspace] = useState("summary");
  const [showAllAttendances, setShowAllAttendances] = useState(false);
  const [classLookupAttemptedFor, setClassLookupAttemptedFor] = useState(null);
  const feedbackInputRef = useRef(null);
  const authorizedClassName = getAuthorizedClassName(student, studentList);
  const serverAttendances = useMemo(() => orderBy(
    student?.Attendances || [],
    [(item) => String(item.attendanceDate || "")],
    ["desc"]
  ), [student?.Attendances]);
  const attendanceWorkspace = useAttendanceOfflineRecords({
    teacherId: isDemo ? null : teacherIdentity?.id,
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
      teacherId: isDemo ? null : teacherIdentity?.id,
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
    isDemo,
  ]);

  useEffect(() => {
    setActiveWorkspace("summary");
    setShowAllAttendances(false);
    setClassLookupAttemptedFor(null);
  }, [studentId]);

  useEffect(() => { setFeedback(student?.feedback || ""); }, [student]);

  useEffect(() => {
    if (
      !student?.id
      || authorizedClassName
      || !onlineHint
      || Number(classLookupAttemptedFor) === Number(student.id)
    ) return;
    setClassLookupAttemptedFor(student.id);
    dispatch(fetchStudentList({}, 1)).catch(() => {});
  }, [
    authorizedClassName,
    classLookupAttemptedFor,
    dispatch,
    onlineHint,
    student?.id,
  ]);

  const handleStudentFeedbackSubmit = (event) => {
    void 'ISSA:CMS.FEEDBACK.SUBMIT_STUDENT_FEEDBACK';
    event.preventDefault();
    if (isDemo) {
      setMessage(DEMO_READ_ONLY_MESSAGE);
      return;
    }
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
    if (isDemo || !teacherIdentity?.id) return;
    return mergeWorkspaceSnapshot({
      teacherId: teacherIdentity.id,
      studentId,
      journalEntries: entries,
    })
      .then((snapshot) => setCachedSnapshot(snapshot))
      .catch(() => {});
  }, [isDemo, studentId, teacherIdentity?.id]);

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
  const scores = orderBy(
    student?.Scores || [],
    [(item) => String(item.recordedAt || "")],
    ["desc"]
  );
  const visibleAttendances = showAllAttendances
    ? attendances
    : attendances.slice(0, 8);
  const attendancePresentCount = attendances.filter(
    (attendance) => String(attendance.status || "").toLowerCase() === "hadir"
  ).length;
  const numericScores = scores
    .map((score) => score.value)
    .filter((score) => score !== null && score !== undefined && score !== "")
    .map(Number)
    .filter(Number.isFinite);
  const averageScore = numericScores.length
    ? Math.round(
      numericScores.reduce((total, score) => total + score, 0)
        / numericScores.length
    )
    : null;
  const latestFeedbackRecord = feedbackHistory.data[0];
  const latestTeacherInformation = latestFeedbackRecord?.content
    || student?.feedback
    || "";
  const recentJournalEntries = orderBy(
    cachedSnapshot?.journalEntries || [],
    [(entry) => String(entry.observedAt || entry.createdAt || "")],
    ["desc"]
  ).slice(0, 2);
  const scoreStatus = (status) => (status === true ? "Lulus" : status === false ? "Belum lulus" : undefined);

  return <PageContainer className="min-w-0 w-full max-w-[90rem] [overflow-wrap:anywhere]">
    <header
      className={[
        "flex min-w-0 items-stretch justify-between overflow-hidden",
        "border-2 border-[var(--accent-strong)]",
        "rounded-[0.25rem]",
        "bg-[var(--accent-strong)] text-white",
        "shadow-[0.28rem_0.3rem_0_rgba(23,62,82,0.14)]",
        "max-[820px]:grid",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-4 p-5 max-[639px]:items-start max-[639px]:gap-3 max-[639px]:p-4">
        {student?.imgUrl ? (
          <img
            className={[
              "grid h-16 w-16 flex-none place-items-center border-2 border-[#fffdf7]",
              "rounded-[0.25rem] bg-[#e8f4f2] object-cover",
              "shadow-[0.18rem_0.2rem_0_#f2d86e]",
              "max-[639px]:h-12 max-[639px]:w-12",
            ].join(" ")}
            src={student.imgUrl}
            alt={student?.name || "Siswa"}
          />
        ) : (
          <div
            className={[
              "grid h-16 w-16 flex-none place-items-center border-2 border-[#fffdf7]",
              "rounded-[0.25rem] bg-[#e8f4f2]",
              "text-xl font-black text-[var(--accent-strong)]",
              "shadow-[0.18rem_0.2rem_0_#f2d86e]",
              "max-[639px]:h-12 max-[639px]:w-12",
            ].join(" ")}
            aria-hidden="true"
          >
            {(student?.name || "S").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="m-0 text-[0.68rem] font-[850] uppercase tracking-[0.13em] text-[#c7e1eb]">
            Record perkembangan siswa
          </p>
          <h1 className="mt-1 max-w-[28ch] text-[clamp(1.45rem,3vw,2rem)] font-[850] leading-[1.05] tracking-[-0.025em] text-white [overflow-wrap:anywhere]">
            {student?.name || "Detail siswa"}
          </h1>
          <dl className="mt-3 flex min-w-0 flex-wrap">
            <div className="min-w-28 py-1 pr-4 max-[639px]:min-w-0">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                NIM
              </dt>
              <dd className="mt-[0.18rem] whitespace-nowrap text-[0.82rem] font-[750] tabular-nums text-white">
                {student?.NIM || "—"}
              </dd>
            </div>
            <div className="min-w-28 border-l border-white/30 px-4 py-1 max-[420px]:border-l-0 max-[420px]:border-t max-[420px]:px-0 max-[420px]:pt-2">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                Kelas
              </dt>
              <dd className="mt-[0.18rem] text-[0.82rem] font-[750] text-white">
                {authorizedClassName || "—"}
              </dd>
            </div>
            <div className="min-w-32 border-l border-white/30 py-1 pl-4 max-[520px]:basis-full max-[520px]:border-l-0 max-[520px]:border-t max-[520px]:pl-0 max-[520px]:pt-2">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                Status
              </dt>
              <dd className="mt-[0.18rem] text-[0.82rem] font-[750] text-white">
                {usingCachedSnapshot ? "Record tersimpan" : "Record aktif"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div
        className={[
          "flex max-w-[20rem] flex-none flex-wrap content-center justify-end gap-2",
          "border-l-2 border-white/25 bg-[#204f62] p-4",
          "max-[820px]:w-full max-[820px]:max-w-none max-[820px]:justify-start",
          "max-[820px]:border-l-0 max-[820px]:border-t-2",
          "max-[520px]:[&>*]:w-full",
        ].join(" ")}
      >
        <SecondaryButton type="button" onClick={() => navigate("/")}>
          Kembali
        </SecondaryButton>
        {usingCachedSnapshot ? (
          <PrimaryButton type="button" disabled>
            Tambah attendance perlu online
          </PrimaryButton>
        ) : (
          <Link className="issa-button issa-button--primary" to="/attendance">
            Catat attendance
          </Link>
        )}
      </div>
    </header>

    {usingCachedSnapshot && (
      <div
        className={[
          "mt-4 flex items-baseline gap-[0.6rem] border border-[#d4a63a]",
          "border-l-[0.35rem] bg-[#fff8df] px-[0.9rem] py-3",
          "text-[0.8rem] text-[#6e531d]",
          "max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-1",
        ].join(" ")}
        role="status"
      >
        <strong className="flex-none text-[#49370f]">Workspace tersimpan</strong>
        <span>Data tersimpan dari {formatCachedAt(cachedSnapshot?.cachedAt)}. Hubungkan kembali untuk memperoleh data terbaru.</span>
      </div>
    )}

    <nav
      className="mt-5 min-w-0 overflow-x-auto border-2 border-[var(--border-strong)] bg-[#fffdf7]"
      aria-label="Workspace siswa"
    >
      <div className="flex min-w-max" role="tablist" aria-label="Data siswa">
        {workspaceViews.map((workspace) => {
          const isActive = activeWorkspace === workspace.id;
          return (
            <button
              key={workspace.id}
              id={`student-workspace-tab-${workspace.id}`}
              className={[
                "min-h-12 border-0 border-r border-[var(--border-strong)] px-5",
                "text-[0.75rem] font-[850] uppercase tracking-[0.08em]",
                "transition-colors last:border-r-0 focus-visible:outline focus-visible:outline-2",
                "focus-visible:outline-offset-[-0.25rem] focus-visible:outline-[#d4a63a]",
                isActive
                  ? "bg-[var(--accent-strong)] text-white"
                  : "bg-[#fffdf7] text-[var(--text)] hover:bg-[#e8f4f2]",
              ].join(" ")}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`student-workspace-${workspace.id}`}
              onClick={() => setActiveWorkspace(workspace.id)}
            >
              {workspace.label}
            </button>
          );
        })}
      </div>
    </nav>

    {activeWorkspace === "summary" && (
      <section
        id="student-workspace-summary"
        className="mt-5 min-w-0"
        role="tabpanel"
        aria-labelledby="student-workspace-tab-summary"
      >
        <header className="mb-4 border-b-2 border-[var(--border-strong)] pb-3">
          <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[var(--accent)]">
            Workspace siswa
          </p>
          <h2 className="mt-1 text-[clamp(1.25rem,2vw,1.6rem)] font-[850] leading-tight tracking-[-0.02em] text-[var(--text)]">
            Ringkasan terkini
          </h2>
          <p className="mt-1 max-w-[72ch] text-[0.8rem] leading-6 text-[var(--muted)]">
            Cakupan terbaru untuk peninjauan cepat tanpa membuka seluruh histori.
          </p>
        </header>

        <div className="grid min-w-0 grid-cols-2 gap-4 max-[820px]:grid-cols-1">
          <Surface className={recordSurfaceClasses}>
            <div className="border-b border-[var(--border-strong)] bg-[#edf6f4] px-4 py-3">
              <p className="m-0 text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[var(--accent)]">
                Kehadiran
              </p>
              <h3 className="mt-1 text-base font-[820] text-[var(--text)]">
                Ringkasan attendance
              </h3>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-[var(--border)]">
              <div className="min-w-0 p-4">
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Record</dt>
                <dd className="mt-1 text-xl font-[850] text-[var(--text)] tabular-nums">{attendances.length}</dd>
              </div>
              <div className="min-w-0 p-4">
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Hadir</dt>
                <dd className="mt-1 text-xl font-[850] text-[var(--text)] tabular-nums">{attendancePresentCount}</dd>
              </div>
              <div className="min-w-0 p-4">
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Terbaru</dt>
                <dd className="mt-1 text-[0.78rem] font-[800] leading-5 text-[var(--text)]">
                  {attendances[0]
                    ? `${formatRecordedDate(attendances[0].attendanceDate)} · ${attendances[0].status}`
                    : "Belum ada"}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className={recordSurfaceClasses}>
            <div className="border-b border-[var(--border-strong)] bg-[#f2eff8] px-4 py-3">
              <p className="m-0 text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[#665982]">
                Akademik
              </p>
              <h3 className="mt-1 text-base font-[820] text-[var(--text)]">
                Ringkasan nilai
              </h3>
            </div>
            {usingCachedSnapshot ? (
              <p className="m-0 p-4 text-[0.82rem] leading-6 text-[var(--muted)]">
                Nilai memerlukan koneksi dan tidak tersedia dalam snapshot offline minimum.
              </p>
            ) : (
              <dl className="grid grid-cols-3 divide-x divide-[var(--border)]">
                <div className="min-w-0 p-4">
                  <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Record</dt>
                  <dd className="mt-1 text-xl font-[850] text-[var(--text)] tabular-nums">{scores.length}</dd>
                </div>
                <div className="min-w-0 p-4">
                  <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Rata-rata</dt>
                  <dd className="mt-1 text-xl font-[850] text-[var(--text)] tabular-nums">{averageScore ?? "-"}</dd>
                </div>
                <div className="min-w-0 p-4">
                  <dt className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Terbaru</dt>
                  <dd className="mt-1 text-[0.78rem] font-[800] leading-5 text-[var(--text)]">
                    {scores[0]
                      ? `${scores[0].Lesson?.name || "Lesson"} · ${scores[0].value}`
                      : "Belum ada"}
                  </dd>
                </div>
              </dl>
            )}
          </Surface>

          <Surface className={recordSurfaceClasses}>
            <div className="border-b border-[var(--border-strong)] bg-[#fff8df] px-4 py-3">
              <p className="m-0 text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[#7f611e]">
                Informasi guru
              </p>
              <h3 className="mt-1 text-base font-[820] text-[var(--text)]">
                Informasi relevan terbaru
              </h3>
            </div>
            <div className="p-4">
              <p className="m-0 whitespace-pre-wrap text-[0.86rem] leading-6 text-[var(--text)]">
                {latestTeacherInformation || "Belum ada informasi guru yang tersimpan."}
              </p>
              {latestFeedbackRecord && (
                <p className="mt-3 border-t border-[var(--border)] pt-3 text-[0.7rem] text-[var(--muted)]">
                  {latestFeedbackRecord.Teacher?.name || "Guru"} · {formatRecordedDate(latestFeedbackRecord.observedAt || latestFeedbackRecord.createdAt)}
                </p>
              )}
            </div>
          </Surface>

          <Surface className={recordSurfaceClasses}>
            <div className="border-b border-[var(--border-strong)] bg-[#eef4f5] px-4 py-3">
              <p className="m-0 text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[var(--accent)]">
                Jurnal & bukti
              </p>
              <h3 className="mt-1 text-base font-[820] text-[var(--text)]">
                Konteks observasi terbaru
              </h3>
            </div>
            {recentJournalEntries.length ? (
              <ol className="m-0 list-none divide-y divide-[var(--border)] p-0">
                {recentJournalEntries.map((entry) => (
                  <li className="min-w-0 p-4" key={entry.id}>
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <strong className="min-w-0 text-[0.76rem] text-[var(--text)]">
                        {entry.teacher?.name || "Guru"}
                      </strong>
                      <time className="flex-none text-[0.68rem] text-[var(--muted)]" dateTime={entry.observedAt}>
                        {formatRecordedDate(entry.observedAt)}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[0.82rem] leading-6 text-[var(--text)]">
                      {entry.content}
                    </p>
                    {entry.evidence && (
                      <p className="mt-2 border-l-2 border-[#d4a63a] pl-2 text-[0.7rem] text-[var(--muted)]">
                        Bukti: {entry.evidence.title || "Evidence terkait"}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 p-4 text-[0.82rem] leading-6 text-[var(--muted)]">
                Belum ada konteks jurnal tersimpan untuk ditampilkan pada ringkasan.
              </p>
            )}
          </Surface>
        </div>
      </section>
    )}

    {activeWorkspace === "attendance" && (
      <section
        id="student-workspace-attendance"
        className="mt-5 min-w-0"
        role="tabpanel"
        aria-labelledby="student-workspace-tab-attendance"
      >
        <header className="mb-4 flex min-w-0 items-end justify-between gap-4 border-b-2 border-[var(--border-strong)] pb-3 max-[639px]:items-start max-[639px]:flex-col">
          <div className="min-w-0">
            <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[var(--accent)]">
              Record operasional
            </p>
            <h2 className="mt-1 text-[clamp(1.25rem,2vw,1.6rem)] font-[850] leading-tight tracking-[-0.02em] text-[var(--text)]">
              Kehadiran
            </h2>
            <p className="mt-1 max-w-[72ch] text-[0.8rem] leading-6 text-[var(--muted)]">
              Record terbaru ditampilkan lebih dahulu. Status pada record yang tersedia tetap dapat diperbarui.
            </p>
          </div>
          <strong className="flex-none text-[0.78rem] text-[var(--text)]">
            {attendances.length ? `${attendances.length} record` : "Belum ada record"}
          </strong>
        </header>

        <Surface className={`${recordSurfaceClasses} !border-t-[#56867e]`}>
          {!isEmpty(attendances) && (
            <div
              className="student-record-attendance-columns hidden border-b border-[var(--border-strong)] bg-[#edf6f4] px-4 py-2 text-[0.62rem] font-[850] uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:grid"
              aria-hidden="true"
            >
              <span>Record</span>
              <span>Status</span>
              <span>Sinkronisasi</span>
            </div>
          )}
          <div className="student-record-attendance-list grid min-w-0 px-4 max-[639px]:px-3">
            {isEmpty(attendances) && (
              <div className="my-4">
                <EmptyState
                  title="Belum ada attendance"
                  description="Konteks kehadiran belum cukup untuk ditinjau."
                />
              </div>
            )}
            {visibleAttendances.map((attendance) => (
              <AttendanceRecordEditor
                key={attendance.id}
                record={attendance}
                saving={attendanceWorkspace.savingEntityKey === attendance.entityKey}
                readOnly={isDemo}
                onChange={(record, status) => {
                  attendanceWorkspace.updateAttendance(record, status)
                    .catch(() => {});
                }}
              />
            ))}
          </div>
          {attendances.length > 8 && (
            <div className="border-t border-[var(--border)] px-4 py-3">
              <SecondaryButton
                type="button"
                onClick={() => setShowAllAttendances((current) => !current)}
              >
                {showAllAttendances
                  ? "Tampilkan 8 record terbaru"
                  : `Tampilkan seluruh ${attendances.length} record`}
              </SecondaryButton>
            </div>
          )}
          <p
            className="m-0 min-h-5 border-t border-[var(--border)] px-4 py-[0.65rem] text-[0.74rem] text-[var(--muted)]"
            aria-live="polite"
          >
            {attendanceWorkspace.message}
          </p>
        </Surface>
      </section>
    )}

    {activeWorkspace === "scores" && (
      <section
        id="student-workspace-scores"
        className="mt-5 min-w-0"
        role="tabpanel"
        aria-labelledby="student-workspace-tab-scores"
      >
        <header className="mb-4 flex min-w-0 items-end justify-between gap-4 border-b-2 border-[var(--border-strong)] pb-3 max-[639px]:items-start max-[639px]:flex-col">
          <div className="min-w-0">
            <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[#665982]">
              Ledger akademik
            </p>
            <h2 className="mt-1 text-[clamp(1.25rem,2vw,1.6rem)] font-[850] leading-tight tracking-[-0.02em] text-[var(--text)]">
              Nilai
            </h2>
            <p className="mt-1 max-w-[72ch] text-[0.8rem] leading-6 text-[var(--muted)]">
              Riwayat nilai, assessment, KKM, dan status dalam satu ledger.
            </p>
          </div>
          {!usingCachedSnapshot && (
            <Link className="issa-button issa-button--secondary" to={`/scores/${studentId}`}>
              Kelola nilai
            </Link>
          )}
        </header>

        {usingCachedSnapshot ? (
          <Surface className={unavailableSurfaceClasses}>
            <EmptyState
              title="Score memerlukan koneksi"
              description="Score tidak disimpan dalam workspace offline minimum."
            />
          </Surface>
        ) : (
          <Surface className={`${recordSurfaceClasses} !border-t-[#72668c]`}>
            {isEmpty(scores) ? (
              <div className="p-4">
                <EmptyState
                  title="Belum ada score"
                  description="Konteks akademik belum cukup untuk ditinjau."
                />
              </div>
            ) : (
              <div className="min-w-0">
                <div
                  className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1.2fr)_8rem_5rem_8rem] gap-4 border-b border-[var(--border-strong)] bg-[#f2eff8] px-4 py-2 text-[0.62rem] font-[850] uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:grid"
                  aria-hidden="true"
                >
                  <span>Pelajaran</span>
                  <span>Assessment</span>
                  <span>Tanggal</span>
                  <span>Nilai</span>
                  <span>Status</span>
                </div>
                <ol className="m-0 list-none divide-y divide-[var(--border)] p-0">
                  {scores.map((score) => (
                    <li
                      key={score.id}
                      className="grid min-w-0 gap-3 px-4 py-3 min-[821px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1.2fr)_8rem_5rem_8rem] min-[821px]:items-center min-[821px]:gap-4"
                    >
                      <div className="min-w-0">
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:hidden">
                          Pelajaran
                        </span>
                        <p className="m-0 text-[0.86rem] font-[820] text-[var(--text)]">
                          {score.Lesson?.name || "Lesson"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:hidden">
                          Assessment
                        </span>
                        <p className="m-0 text-[0.8rem] text-[var(--text)]">
                          {score.Assignment?.name || "Assessment"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:hidden">
                          Tanggal
                        </span>
                        <time className="block text-[0.75rem] text-[var(--muted)]" dateTime={score.recordedAt}>
                          {formatRecordedDate(score.recordedAt)}
                        </time>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:hidden">
                          Nilai
                        </span>
                        <strong className="block text-lg text-[var(--text)] tabular-nums">
                          {score.value}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] min-[821px]:hidden">
                          KKM {score.Lesson?.KKM ?? "-"}
                        </span>
                        <StatusBadge status={scoreStatus(score.status)} />
                        <span className="mt-1 hidden text-[0.65rem] text-[var(--muted)] min-[821px]:block">
                          KKM {score.Lesson?.KKM ?? "-"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Surface>
        )}
      </section>
    )}

    {activeWorkspace === "journal-evidence" && (
      <section
        id="student-workspace-journal-evidence"
        className="mt-5 min-w-0"
        role="tabpanel"
        aria-labelledby="student-workspace-tab-journal-evidence"
      >
        <header className="mb-4 border-b-2 border-[var(--border-strong)] pb-3">
          <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[var(--accent)]">
            Observasi dan dokumentasi
          </p>
          <h2 className="mt-1 text-[clamp(1.25rem,2vw,1.6rem)] font-[850] leading-tight tracking-[-0.02em] text-[var(--text)]">
            Jurnal & Bukti
          </h2>
          <p className="mt-1 max-w-[72ch] text-[0.8rem] leading-6 text-[var(--muted)]">
            Form pencatatan dan histori jurnal berada di area jurnal; unggahan dan histori evidence berada di area bukti.
          </p>
        </header>
        <div className="grid min-w-0 grid-cols-2 items-start gap-5 max-[1120px]:grid-cols-1">
          <StudentLearningJournalSection
            studentId={studentId}
            refreshKey={journalRefreshKey}
            cachedEntries={cachedSnapshot?.journalEntries || []}
            hasCachedSnapshot={Boolean(cachedSnapshot)}
            demoReadOnly={isDemo}
            offlineReadOnly={usingCachedSnapshot}
            onJournalLoaded={handleJournalLoaded}
          />
          {usingCachedSnapshot ? (
            <Surface className={unavailableSurfaceClasses}>
              <EmptyState
                title="Evidence memerlukan koneksi"
                description="Evidence tidak disimpan dalam workspace offline minimum."
              />
            </Surface>
          ) : (
            <StudentEvidenceSection
              studentId={studentId}
              demoReadOnly={isDemo}
              onEvidenceChanged={() => {
                setJournalRefreshKey((current) => current + 1);
              }}
            />
          )}
        </div>
      </section>
    )}

    {activeWorkspace === "feedback" && (
      <section
        id="student-workspace-feedback"
        className="mt-5 min-w-0"
        role="tabpanel"
        aria-labelledby="student-workspace-tab-feedback"
      >
        <header className="mb-4 border-b-2 border-[var(--border-strong)] pb-3">
          <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[#7f611e]">
            Narasi milik guru
          </p>
          <h2 className="mt-1 text-[clamp(1.25rem,2vw,1.6rem)] font-[850] leading-tight tracking-[-0.02em] text-[var(--text)]">
            Feedback
          </h2>
          <p className="mt-1 max-w-[72ch] text-[0.8rem] leading-6 text-[var(--muted)]">
            Susun, tinjau, dan simpan feedback berbasis record. AI hanya membantu menyusun draf; keputusan akhir tetap pada guru.
          </p>
        </header>
        {usingCachedSnapshot ? (
          <Surface className={unavailableSurfaceClasses}>
            <EmptyState
              title="Feedback memerlukan koneksi"
              description="Feedback tidak disimpan dalam workspace offline minimum."
            />
          </Surface>
        ) : (
          <div className="grid min-w-0 grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] items-start gap-5 max-[1080px]:grid-cols-1">
            <FeedbackForm
              feedback={feedback}
              feedbackInputRef={feedbackInputRef}
              isDemo={isDemo}
              observedAt={observedAt}
              message={message}
              submitting={submitting}
              onAiDraftRequested={() => setAiWorkspaceOpen(true)}
              onFeedbackChange={(event) => setFeedback(event.target.value)}
              onObservedAtChange={setObservedAt}
              onSubmit={handleStudentFeedbackSubmit}
            />
            <FeedbackHistory resource={feedbackHistory} onRetry={fetchStudentFeedbackHistory} />
          </div>
        )}
      </section>
    )}

    <AiNarrativeWorkspace
      open={aiWorkspaceOpen}
      studentId={studentId}
      existingFeedback={feedback}
      onClose={() => setAiWorkspaceOpen(false)}
      onUseFeedback={handleAiDraftHandoff}
    />
  </PageContainer>;
}
