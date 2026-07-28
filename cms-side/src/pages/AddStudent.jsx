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
import "../features/students/student-record.css";

const sectionIndexClasses = [
  "grid min-w-0 [place-items:start_center] border-r border-[var(--border-strong)]",
  "pt-[1.15rem] text-[0.7rem] font-[850] tracking-[0.08em] text-[var(--muted)]",
].join(" ");

const sectionKickerClasses = [
  "m-0 text-[0.68rem] font-[850] uppercase tracking-[0.13em]",
  "text-[var(--accent)]",
].join(" ");

const sectionTitleClasses = [
  "mt-[0.3rem] text-[clamp(1.2rem,2vw,1.5rem)] font-[820]",
  "leading-[1.2] tracking-[-0.015em] text-[var(--text)]",
].join(" ");

const recordSectionClasses = "mt-8 min-w-0";

const recordSectionHeadingClasses = [
  "mb-4 grid min-w-0 grid-cols-[3rem_minmax(0,1fr)]",
  "border-y border-b-[var(--border-strong)] border-t-2 border-t-[var(--accent-strong)]",
  "bg-[#edf6f4] max-[639px]:grid-cols-[2.25rem_minmax(0,1fr)]",
].join(" ");

const recordSurfaceClasses = [
  "min-w-0 overflow-hidden !border-2 !border-[var(--border-strong)]",
  "!rounded-[0.25rem_var(--surface-radius)_0.25rem_0.25rem] !bg-[#fffdf7]",
].join(" ");

const unavailableSurfaceClasses = [
  "min-w-0 !border-2 !border-[var(--border-strong)]",
  "!rounded-[0.25rem_var(--surface-radius)_0.25rem_0.25rem]",
  "!bg-[#fffdf7] p-5",
].join(" ");

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
  return <PageContainer className="min-w-0 w-full max-w-[90rem] [overflow-wrap:anywhere]">
    <header
      className={[
        "flex min-w-0 items-end justify-between gap-6 overflow-hidden",
        "border-2 border-[var(--accent-strong)]",
        "rounded-[0.25rem_var(--surface-radius)_0.25rem_0.25rem]",
        "bg-[var(--accent-strong)] text-white",
        "shadow-[0.42rem_0.46rem_0_rgba(23,62,82,0.14)]",
        "max-[1080px]:items-stretch max-[820px]:grid",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-5 p-6 max-[639px]:items-start max-[639px]:gap-[0.9rem] max-[639px]:p-[1.1rem]">
        {student?.imgUrl ? (
          <img
            className={[
              "grid size-[5.25rem] flex-none place-items-center border-2 border-[#fffdf7]",
              "rounded-[0.75rem_0.25rem_1rem_0.25rem] bg-[#e8f4f2]",
              "object-cover shadow-[0.24rem_0.28rem_0_#f2d86e]",
              "max-[639px]:size-16",
            ].join(" ")}
            src={student.imgUrl}
            alt={student?.name || "Siswa"}
          />
        ) : (
          <div
            className={[
              "grid size-[5.25rem] flex-none place-items-center border-2 border-[#fffdf7]",
              "rounded-[0.75rem_0.25rem_1rem_0.25rem] bg-[#e8f4f2]",
              "text-[1.75rem] font-black text-[var(--accent-strong)]",
              "shadow-[0.24rem_0.28rem_0_#f2d86e] max-[639px]:size-16",
            ].join(" ")}
            aria-hidden="true"
          >
            {(student?.name || "S").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="m-0 text-[0.68rem] font-[850] uppercase tracking-[0.13em] text-[#c7e1eb]">
            Student development record
          </p>
          <h1 className="mt-[0.22rem] max-w-[22ch] text-[clamp(2rem,4vw,2.75rem)] font-[850] leading-[1.02] tracking-[-0.035em] text-white [overflow-wrap:anywhere] max-[639px]:text-[clamp(1.85rem,10vw,2.35rem)]">
            {student?.name || "Detail siswa"}
          </h1>
          <dl className="mt-4 flex flex-wrap max-[639px]:mt-[0.8rem] max-[639px]:grid max-[639px]:grid-cols-1">
            <div className="min-w-36 py-[0.35rem] pr-4 max-[639px]:min-w-0 max-[639px]:border-t max-[639px]:border-white/20 max-[639px]:py-[0.45rem] max-[639px]:pr-0">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                NIM
              </dt>
              <dd className="mt-[0.18rem] text-[0.82rem] font-[750] text-white">
                {student?.NIM || "Belum tersedia"}
              </dd>
            </div>
            <div className="min-w-36 border-l border-white/30 py-[0.35rem] px-4 max-[639px]:min-w-0 max-[639px]:border-l-0 max-[639px]:border-t max-[639px]:border-white/20 max-[639px]:px-0 max-[639px]:py-[0.45rem]">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                Kelas
              </dt>
              <dd className="mt-[0.18rem] text-[0.82rem] font-[750] text-white">
                {student?.Class?.name || "Kelas Anda"}
              </dd>
            </div>
            <div className="min-w-36 border-l border-white/30 py-[0.35rem] pl-4 max-[639px]:min-w-0 max-[639px]:border-l-0 max-[639px]:border-t max-[639px]:border-white/20 max-[639px]:py-[0.45rem] max-[639px]:pl-0">
              <dt className="text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#c7e1eb]">
                Status workspace
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
          "flex max-w-[22rem] flex-none flex-wrap justify-end gap-[0.65rem]",
          "border-l-2 border-white/25 bg-[#204f62] p-5",
          "max-[1080px]:max-w-[17rem] max-[1080px]:content-center",
          "max-[820px]:w-full max-[820px]:max-w-none max-[820px]:justify-start",
          "max-[820px]:border-l-0 max-[820px]:border-t-2",
          "max-[639px]:p-4 max-[639px]:[&>*]:w-full",
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

    <section
      className={[
        "mt-6 grid min-w-0 grid-cols-[3rem_minmax(0,1fr)_minmax(14rem,0.42fr)]",
        "border-2 border-[var(--border-strong)] border-l-[var(--accent)] bg-[#fffdf7]",
        "max-[820px]:grid-cols-[3rem_minmax(0,1fr)]",
        "max-[639px]:grid-cols-[2.25rem_minmax(0,1fr)]",
      ].join(" ")}
      aria-labelledby="student-development-summary-title"
    >
      <div className={sectionIndexClasses} aria-hidden="true">01</div>
      <div className="min-w-0 px-[1.4rem] pb-[1.4rem] pt-5 max-[639px]:px-[0.9rem]">
        <p className={sectionKickerClasses}>Current understanding</p>
        <h2 id="student-development-summary-title" className={sectionTitleClasses}>
          Ringkasan perkembangan
        </h2>
        <p
          className={[
            "mt-3 max-w-[68ch] whitespace-pre-wrap text-[0.98rem]",
            "leading-[1.75] text-[var(--text)]",
            student?.feedback
              ? ""
              : "border-l-4 border-[#d4a63a] pl-[0.8rem] text-[var(--muted)]",
          ].join(" ")}
        >
          {student?.feedback || "Belum ada ringkasan perkembangan tersimpan. Tambahkan observasi faktual agar record ini memiliki konteks yang dapat ditinjau."}
        </p>
      </div>
      <dl
        className={[
          "col-start-3 grid grid-cols-2 border-l border-[var(--border-strong)] bg-[#e8f4f2]",
          "max-[820px]:col-start-2 max-[820px]:border-l-0 max-[820px]:border-t",
          "max-[639px]:col-span-full max-[639px]:col-start-1",
        ].join(" ")}
        aria-label="Cakupan record"
      >
        <div className="min-w-0 px-4 py-5 max-[639px]:p-[0.9rem]">
          <dt className="text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[var(--muted)]">
            Attendance
          </dt>
          <dd className="mt-[0.35rem] text-[0.9rem] font-extrabold text-[var(--text)]">
            {attendances.length ? `${attendances.length} record` : "Data terbatas"}
          </dd>
        </div>
        <div className="min-w-0 border-l border-[var(--border-strong)] px-4 py-5 max-[639px]:p-[0.9rem]">
          <dt className="text-[0.64rem] font-[850] uppercase tracking-[0.1em] text-[var(--muted)]">
            Score
          </dt>
          <dd className="mt-[0.35rem] text-[0.9rem] font-extrabold text-[var(--text)]">
            {scores.length ? `${scores.length} record` : "Data terbatas"}
          </dd>
        </div>
      </dl>
    </section>

    <section className={recordSectionClasses} aria-labelledby="student-context-title">
      <header className={recordSectionHeadingClasses}>
        <div className={sectionIndexClasses} aria-hidden="true">02</div>
        <div className="min-w-0 px-[1.1rem] pb-4 pt-[0.9rem] max-[639px]:px-[0.9rem]">
          <p className={sectionKickerClasses}>Supporting records</p>
          <h2 id="student-context-title" className={sectionTitleClasses}>
            Konteks attendance dan akademik
          </h2>
          <span className="mt-[0.38rem] block max-w-[72ch] text-[0.82rem] leading-6 text-[var(--muted)]">
            Record pendukung memberi konteks tanpa menentukan kesimpulan siswa.
          </span>
        </div>
      </header>
      <div className="grid min-w-0 grid-cols-2 items-start gap-5 max-[820px]:grid-cols-1">
        <Surface className={`${recordSurfaceClasses} !border-t-[#56867e]`}>
          <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border-strong)] bg-[#edf6f4] px-[1.1rem] py-4 max-[639px]:flex-wrap">
            <div className="min-w-0">
              <p className={sectionKickerClasses}>A / Attendance</p>
              <h3 className="mt-[0.2rem] text-base font-[820] text-[var(--text)]">
                Attendance record
              </h3>
              <span className="mt-[0.3rem] block text-[0.76rem] leading-6 text-[var(--muted)]">
                Perbarui record yang sudah ada. Attendance baru tetap memerlukan koneksi.
              </span>
            </div>
            <strong className="flex-none border-l-2 border-[var(--border-strong)] pl-[0.8rem] text-[0.8rem] text-[var(--text)] max-[639px]:basis-full max-[639px]:border-l-0 max-[639px]:border-t max-[639px]:pl-0 max-[639px]:pt-[0.55rem]">
              {attendances.length ? `${attendances.length} tercatat` : "Belum ada"}
            </strong>
          </div>
          <div className="student-record-attendance-list grid min-w-0 px-[1.1rem] max-[639px]:px-[0.9rem]">
            {isEmpty(attendances) && (
              <div className="my-4">
                <EmptyState
                  title="Belum ada attendance"
                  description="Konteks kehadiran belum cukup untuk ditinjau."
                />
              </div>
            )}
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
          <p
            className="m-0 min-h-5 border-t border-[var(--border)] px-[1.1rem] py-[0.65rem] text-[0.74rem] text-[var(--muted)]"
            aria-live="polite"
          >
            {attendanceWorkspace.message}
          </p>
        </Surface>

        {usingCachedSnapshot ? (
          <Surface className={`${recordSurfaceClasses} !border-t-[#72668c]`}>
            <div className="grid min-w-0 px-[1.1rem] max-[639px]:px-[0.9rem]">
              <div className="my-4">
                <EmptyState
                  title="Score memerlukan koneksi"
                  description="Score tidak disimpan dalam workspace offline minimum."
                />
              </div>
            </div>
          </Surface>
        ) : (
          <Surface className={`${recordSurfaceClasses} !border-t-[#72668c]`}>
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border-strong)] bg-[#f2eff8] px-[1.1rem] py-4 max-[639px]:flex-wrap">
              <div className="min-w-0">
                <p className={sectionKickerClasses}>B / Academic</p>
                <h3 className="mt-[0.2rem] text-base font-[820] text-[var(--text)]">
                  Score record
                </h3>
                <span className="mt-[0.3rem] block text-[0.76rem] leading-6 text-[var(--muted)]">
                  Nilai dan KKM per assessment.
                </span>
              </div>
              <Link className="issa-button issa-button--secondary" to={`/scores/${studentId}`}>
                Kelola
              </Link>
            </div>
            <div className="grid min-w-0 px-[1.1rem] max-[639px]:px-[0.9rem]">
              {isEmpty(scores) && (
                <div className="my-4">
                  <EmptyState
                    title="Belum ada score"
                    description="Konteks akademik belum cukup untuk ditinjau."
                  />
                </div>
              )}
              {scores.map((score, scoreIndex) => (
                <article
                  key={score.id}
                  className={[
                    "flex min-w-0 items-start justify-between gap-4 bg-transparent py-4",
                    "max-[639px]:gap-3",
                    scoreIndex > 0 ? "border-t border-[var(--border)]" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="m-0 text-[0.9rem] font-extrabold text-[var(--text)]">
                      {score.Lesson?.name || "Lesson"}
                    </p>
                    <span className="mt-1 block text-[0.74rem] text-[var(--muted)]">
                      {score.Assignment?.name || "Assessment"} · KKM {score.Lesson?.KKM ?? "-"}
                    </span>
                    <time
                      className="mt-2 block text-[0.74rem] text-[var(--muted)]"
                      dateTime={score.recordedAt}
                    >
                      {formatRecordedDate(score.recordedAt)}
                    </time>
                  </div>
                  <div className="grid flex-none justify-items-end gap-[0.35rem]">
                    <strong className="text-[1.35rem] leading-none text-[var(--text)] tabular-nums">
                      {score.value}
                    </strong>
                    <StatusBadge status={scoreStatus(score.status)} />
                  </div>
                </article>
              ))}
            </div>
          </Surface>
        )}
      </div>
    </section>

    <section className={recordSectionClasses} aria-labelledby="student-learning-records-title">
      <header className={recordSectionHeadingClasses}>
        <div className={sectionIndexClasses} aria-hidden="true">03</div>
        <div className="min-w-0 px-[1.1rem] pb-4 pt-[0.9rem] max-[639px]:px-[0.9rem]">
          <p className={sectionKickerClasses}>Observed learning</p>
          <h2 id="student-learning-records-title" className={sectionTitleClasses}>
            Catatan dan bukti belajar
          </h2>
          <span className="mt-[0.38rem] block max-w-[72ch] text-[0.82rem] leading-6 text-[var(--muted)]">
            Observasi kronologis dibaca bersama dokumentasi yang mendukungnya.
          </span>
        </div>
      </header>
      <div className="grid min-w-0 grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)] items-start gap-5 max-[1080px]:grid-cols-1">
        <StudentLearningJournalSection
          studentId={studentId}
          refreshKey={journalRefreshKey}
          cachedEntries={cachedSnapshot?.journalEntries || []}
          hasCachedSnapshot={Boolean(cachedSnapshot)}
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
            onEvidenceChanged={() => {
              setJournalRefreshKey((current) => current + 1);
            }}
          />
        )}
      </div>
    </section>

    <section className={recordSectionClasses} aria-labelledby="student-feedback-title">
      <header className={recordSectionHeadingClasses}>
        <div className={sectionIndexClasses} aria-hidden="true">04</div>
        <div className="min-w-0 px-[1.1rem] pb-4 pt-[0.9rem] max-[639px]:px-[0.9rem]">
          <p className={sectionKickerClasses}>Teacher-owned narrative</p>
          <h2 id="student-feedback-title" className={sectionTitleClasses}>
            Tinjau dan simpan Feedback
          </h2>
          <span className="mt-[0.38rem] block max-w-[72ch] text-[0.82rem] leading-6 text-[var(--muted)]">
            Gunakan record di atas sebagai dasar. AI hanya membantu menyusun draf; keputusan akhir tetap pada guru.
          </span>
        </div>
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

    <AiNarrativeWorkspace
      open={aiWorkspaceOpen}
      studentId={studentId}
      existingFeedback={feedback}
      onClose={() => setAiWorkspaceOpen(false)}
      onUseFeedback={handleAiDraftHandoff}
    />
  </PageContainer>;
}
