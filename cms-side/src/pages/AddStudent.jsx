import { tw } from "../shared/ui/tw";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  PageContainer,
  PrimaryButton,
  SectionHeader,
  SecondaryButton,
  StatusBadge,
  StudentContextHeader,
  Surface,
  WorkspacePanel,
  WorkspaceTabs,
} from "../shared/ui/ui";
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

const recordSurfaceClasses = "student-record-surface min-w-0 overflow-hidden";
const unavailableSurfaceClasses = "student-record-unavailable min-w-0 p-6";

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
  if (detailError) return <PageContainer><Surface className={tw("p-5")}><ErrorState message={detailError} /><SecondaryButton className={tw("mt-4")} type="button" onClick={() => navigate("/")}>Kembali ke dashboard</SecondaryButton></Surface></PageContainer>;

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

  return <PageContainer>
    <StudentContextHeader
      student={student}
      classLabel={authorizedClassName}
      eyebrow="Record perkembangan siswa"
      headingLevel="h1"
      metadata={[
        {
          label: "Status",
          value: usingCachedSnapshot ? "Record tersimpan" : "Record aktif",
        },
      ]}
      actions={(
        <>
        <SecondaryButton type="button" onClick={() => navigate("/")}>
          Kembali
        </SecondaryButton>
        {usingCachedSnapshot ? (
          <PrimaryButton type="button" disabled>
            Tambah attendance perlu online
          </PrimaryButton>
        ) : (
          <ButtonLink tone="primary" to="/attendance">
            Catat attendance
          </ButtonLink>
        )}
        </>
      )}
    />

    {usingCachedSnapshot && (
      <InlineNotice className={tw("student-workspace-notice mt-4")} tone="warning">
        <strong>Workspace tersimpan. </strong>
        <span>Data tersimpan dari {formatCachedAt(cachedSnapshot?.cachedAt)}. Hubungkan kembali untuk memperoleh data terbaru.</span>
      </InlineNotice>
    )}

    <WorkspaceTabs
      className={tw("student-workspace-navigation mt-4")}
      items={workspaceViews}
      activeId={activeWorkspace}
      onChange={setActiveWorkspace}
      ariaLabel="Workspace siswa"
      idPrefix="student-workspace"
    />

    {activeWorkspace === "summary" && (
      <WorkspacePanel
        id="student-workspace-summary"
        labelledBy="student-workspace-tab-summary"
      >
        <SectionHeader
          eyebrow="Workspace siswa"
          title="Ringkasan terkini"
          description="Cakupan terbaru untuk peninjauan cepat tanpa membuka seluruh histori."
        />

        <div className={tw("student-summary-grid grid min-w-0 items-start gap-4 md:grid-cols-2")}>
          <Surface className={tw(recordSurfaceClasses)}>
            <div className={tw("student-summary-card__header border-b border-issa-border py-3 px-4 bg-issa-subtle [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold")}>
              <p>Kehadiran</p>
              <h3>Ringkasan attendance</h3>
            </div>
            <dl className={tw("student-summary-metrics grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [&>div]:min-w-0 [&>div]:p-4 [&>div+div]:border-l [&>div+div]:border-issa-border [&_dt]:text-issa-muted [&_dt]:text-metadata [&_dt]:font-bold [&_dt]:tracking-metadata [&_dt]:uppercase [&_dd]:mt-1 [&_dd]:text-issa-text [&_dd:not(.student-summary-metrics__detail)]:text-section-title [&_dd]:font-bold [&_dd]:tabular-nums")}>
              <div>
                <dt>Record</dt>
                <dd>{attendances.length}</dd>
              </div>
              <div>
                <dt>Hadir</dt>
                <dd>{attendancePresentCount}</dd>
              </div>
              <div>
                <dt>Terbaru</dt>
                <dd className={tw("student-summary-metrics__detail text-supporting leading-normal")}>
                  {attendances[0]
                    ? `${formatRecordedDate(attendances[0].attendanceDate)} · ${attendances[0].status}`
                    : "Belum ada"}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className={tw(recordSurfaceClasses)}>
            <div className={tw("student-summary-card__header border-b border-issa-border py-3 px-4 bg-issa-subtle [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold")}>
              <p>Akademik</p>
              <h3>Ringkasan nilai</h3>
            </div>
            {usingCachedSnapshot ? (
              <p className={tw("student-summary-card__empty p-4 text-issa-muted text-supporting leading-normal")}>
                Nilai memerlukan koneksi dan tidak tersedia dalam snapshot offline minimum.
              </p>
            ) : (
              <dl className={tw("student-summary-metrics grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [&>div]:min-w-0 [&>div]:p-4 [&>div+div]:border-l [&>div+div]:border-issa-border [&_dt]:text-issa-muted [&_dt]:text-metadata [&_dt]:font-bold [&_dt]:tracking-metadata [&_dt]:uppercase [&_dd]:mt-1 [&_dd]:text-issa-text [&_dd:not(.student-summary-metrics__detail)]:text-section-title [&_dd]:font-bold [&_dd]:tabular-nums")}>
                <div>
                  <dt>Record</dt>
                  <dd>{scores.length}</dd>
                </div>
                <div>
                  <dt>Rata-rata</dt>
                  <dd>{averageScore ?? "-"}</dd>
                </div>
                <div>
                  <dt>Terbaru</dt>
                  <dd className={tw("student-summary-metrics__detail text-supporting leading-normal")}>
                    {scores[0]
                      ? `${scores[0].Lesson?.name || "Lesson"} · ${scores[0].value}`
                      : "Belum ada"}
                  </dd>
                </div>
              </dl>
            )}
          </Surface>

          <Surface className={tw(recordSurfaceClasses)}>
            <div className={tw("student-summary-card__header border-b border-issa-border py-3 px-4 bg-issa-subtle [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold")}>
              <p>Informasi guru</p>
              <h3>Informasi relevan terbaru</h3>
            </div>
            <div className={tw("student-summary-card__body p-4 text-issa-muted text-supporting leading-normal")}>
              <p className={tw("text-issa-text whitespace-pre-wrap")}>
                {latestTeacherInformation || "Belum ada informasi guru yang tersimpan."}
              </p>
              {latestFeedbackRecord && (
                <p className={tw("student-summary-card__metadata mt-3 border-t border-issa-border pt-3 text-issa-muted text-metadata")}>
                  {latestFeedbackRecord.Teacher?.name || "Guru"} · {formatRecordedDate(latestFeedbackRecord.observedAt || latestFeedbackRecord.createdAt)}
                </p>
              )}
            </div>
          </Surface>

          <Surface className={tw(recordSurfaceClasses)}>
            <div className={tw("student-summary-card__header border-b border-issa-border py-3 px-4 bg-issa-subtle [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold")}>
              <p>Jurnal & bukti</p>
              <h3>Konteks observasi terbaru</h3>
            </div>
            {recentJournalEntries.length ? (
              <ol className={tw("student-summary-history m-0 p-0 list-none")}>
                {recentJournalEntries.map((entry) => (
                  <li className={tw("min-w-0 p-4 [&+&]:border-t [&+&]:border-issa-border")} key={entry.id}>
                    <div className={tw("student-summary-history__metadata flex min-w-0 items-baseline justify-between gap-3")}>
                      <strong className={tw("min-w-0 text-issa-text text-supporting")}>
                        {entry.teacher?.name || "Guru"}
                      </strong>
                      <time className={tw("text-issa-muted text-metadata")} dateTime={entry.observedAt}>
                        {formatRecordedDate(entry.observedAt)}
                      </time>
                    </div>
                    <p className={tw("student-summary-history__body mt-2 text-issa-text text-supporting leading-normal")}>
                      {entry.content}
                    </p>
                    {entry.evidence && (
                      <p className={tw("student-summary-history__evidence mt-2 border-l-emphasis border-issa-info pl-2")}>
                        Bukti: {entry.evidence.title || "Evidence terkait"}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className={tw("student-summary-card__empty p-4 text-issa-muted text-supporting leading-normal")}>
                Belum ada konteks jurnal tersimpan untuk ditampilkan pada ringkasan.
              </p>
            )}
          </Surface>
        </div>
      </WorkspacePanel>
    )}

    {activeWorkspace === "attendance" && (
      <WorkspacePanel
        id="student-workspace-attendance"
        labelledBy="student-workspace-tab-attendance"
      >
        <SectionHeader
          eyebrow="Record operasional"
          title="Kehadiran"
          description="Record terbaru ditampilkan lebih dahulu. Status pada record yang tersedia tetap dapat diperbarui."
          actions={<strong className={tw("student-workspace-count text-issa-text text-supporting")}>
            {attendances.length ? `${attendances.length} record` : "Belum ada record"}
          </strong>}
        />

        <Surface className={tw(recordSurfaceClasses)}>
          {!isEmpty(attendances) && (
            <div
              className={tw("student-record-attendance-columns hidden border-b border-issa-border py-2 px-4 bg-issa-subtle text-issa-muted text-table-header font-bold tracking-metadata uppercase md:grid max-md:hidden")}
              aria-hidden="true"
            >
              <span>Record</span>
              <span>Status</span>
              <span>Sinkronisasi</span>
            </div>
          )}
          <div className={tw("student-record-attendance-list grid min-w-0 py-0 px-4 md:[&>.attendance-offline-record]:[grid-template-columns:minmax(12rem,_1.15fr)_minmax(12rem,_0.9fr)_minmax(9rem,_0.7fr)] [&>.attendance-offline-record]:min-w-0 [&>.attendance-offline-record]:items-end [&>.attendance-offline-record]:gap-4 [&>.attendance-offline-record]:border-0 [&>.attendance-offline-record]:rounded-none [&>.attendance-offline-record]:bg-transparent [&>.attendance-offline-record]:py-3 [&>.attendance-offline-record]:px-0 [&>.attendance-offline-record+_.attendance-offline-record]:border-t [&>.attendance-offline-record+_.attendance-offline-record]:border-issa-border max-md:[&>.attendance-offline-record]:grid-cols-1 max-md:[&>.attendance-offline-record]:items-stretch [&>.attendance-offline-record>*]:min-w-0 [&_.attendance-offline-record__error]:col-span-full")}>
            {isEmpty(attendances) && (
              <div className={tw("my-4")}>
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
            <div className={tw("student-record-ledger__actions border-t border-issa-border py-3 px-4")}>
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
            className={tw("student-record-ledger__message min-h-6 border-t border-issa-border py-3 px-4 text-issa-muted text-metadata")}
            aria-live="polite"
          >
            {attendanceWorkspace.message}
          </p>
        </Surface>
      </WorkspacePanel>
    )}

    {activeWorkspace === "scores" && (
      <WorkspacePanel
        id="student-workspace-scores"
        labelledBy="student-workspace-tab-scores"
      >
        <SectionHeader
          eyebrow="Ledger akademik"
          title="Nilai"
          description="Riwayat nilai, assessment, KKM, dan status dalam satu ledger."
          actions={!usingCachedSnapshot && (
            <ButtonLink to={`/scores/${studentId}`}>
              Kelola nilai
            </ButtonLink>
          )}
        />

        {usingCachedSnapshot ? (
          <Surface className={tw(unavailableSurfaceClasses)}>
            <EmptyState
              title="Score memerlukan koneksi"
              description="Score tidak disimpan dalam workspace offline minimum."
            />
          </Surface>
        ) : (
          <Surface className={tw(recordSurfaceClasses)}>
            {isEmpty(scores) ? (
              <div className={tw("p-4")}>
                <EmptyState
                  title="Belum ada score"
                  description="Konteks akademik belum cukup untuk ditinjau."
                />
              </div>
            ) : (
              <div className={tw("student-score-ledger min-w-0")}>
                <div
                  className={tw("student-score-ledger__columns hidden min-w-0 gap-3 border-b border-issa-border py-3 px-4 bg-issa-subtle text-issa-muted text-metadata font-bold tracking-metadata uppercase md:grid md:[grid-template-columns:minmax(0,_1.25fr)_minmax(0,_1.2fr)_8rem_5rem_8rem] md:items-center md:gap-4")}
                  aria-hidden="true"
                >
                  <span>Pelajaran</span>
                  <span>Assessment</span>
                  <span>Tanggal</span>
                  <span>Nilai</span>
                  <span>Status</span>
                </div>
                <ol className={tw("student-score-ledger__list m-0 p-0 list-none")}>
                  {scores.map((score) => (
                    <li
                      key={score.id}
                      className={tw("student-score-ledger__row grid min-w-0 gap-3 py-3 px-4 [&+&]:border-t [&+&]:border-issa-border md:[grid-template-columns:minmax(0,_1.25fr)_minmax(0,_1.2fr)_8rem_5rem_8rem] md:items-center md:gap-4")}
                    >
                      <div className={tw("min-w-0")}>
                        <span className={tw("student-score-ledger__label text-issa-muted text-metadata font-bold tracking-metadata uppercase md:hidden")}>
                          Pelajaran
                        </span>
                        <p className={tw("student-score-ledger__primary text-issa-text text-table font-semibold")}>
                          {score.Lesson?.name || "Lesson"}
                        </p>
                      </div>
                      <div className={tw("min-w-0")}>
                        <span className={tw("student-score-ledger__label text-issa-muted text-metadata font-bold tracking-metadata uppercase md:hidden")}>
                          Assessment
                        </span>
                        <p className={tw("student-score-ledger__secondary block text-issa-muted text-supporting")}>
                          {score.Assignment?.name || "Assessment"}
                        </p>
                      </div>
                      <div className={tw("min-w-0")}>
                        <span className={tw("student-score-ledger__label text-issa-muted text-metadata font-bold tracking-metadata uppercase md:hidden")}>
                          Tanggal
                        </span>
                        <time className={tw("student-score-ledger__secondary block text-issa-muted text-supporting")} dateTime={score.recordedAt}>
                          {formatRecordedDate(score.recordedAt)}
                        </time>
                      </div>
                      <div className={tw("min-w-0")}>
                        <span className={tw("student-score-ledger__label text-issa-muted text-metadata font-bold tracking-metadata uppercase md:hidden")}>
                          Nilai
                        </span>
                        <strong className={tw("student-score-ledger__value block text-issa-text text-section-title [font-variant-numeric:tabular-nums]")}>
                          {score.value}
                        </strong>
                      </div>
                      <div className={tw("min-w-0")}>
                        <span className={tw("student-score-ledger__label text-issa-muted text-metadata font-bold tracking-metadata uppercase md:hidden")}>
                          Status
                        </span>
                        <StatusBadge status={scoreStatus(score.status)} />
                        <span className={tw("student-score-ledger__kkm block mt-1 text-issa-muted text-supporting")}>
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
      </WorkspacePanel>
    )}

    {activeWorkspace === "journal-evidence" && (
      <WorkspacePanel
        id="student-workspace-journal-evidence"
        labelledBy="student-workspace-tab-journal-evidence"
      >
        <SectionHeader
          eyebrow="Observasi dan dokumentasi"
          title="Jurnal & Bukti"
          description="Form pencatatan dan histori jurnal berada di area jurnal; unggahan dan histori evidence berada di area bukti."
        />
        <div className={tw("student-journal-evidence-grid grid min-w-0 items-start gap-4 lg:grid-cols-2")}>
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
            <Surface className={tw(unavailableSurfaceClasses)}>
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
      </WorkspacePanel>
    )}

    {activeWorkspace === "feedback" && (
      <WorkspacePanel
        id="student-workspace-feedback"
        labelledBy="student-workspace-tab-feedback"
      >
        <SectionHeader
          eyebrow="Narasi milik guru"
          title="Feedback"
          description="Susun, tinjau, dan simpan feedback berbasis record. AI hanya membantu menyusun draf; keputusan akhir tetap pada guru."
        />
        {usingCachedSnapshot ? (
          <Surface className={tw(unavailableSurfaceClasses)}>
            <EmptyState
              title="Feedback memerlukan koneksi"
              description="Feedback tidak disimpan dalam workspace offline minimum."
            />
          </Surface>
        ) : (
          <div className={tw("student-feedback-grid grid min-w-0 items-start gap-4 lg:grid-cols-2")}>
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
      </WorkspacePanel>
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
