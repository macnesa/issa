import { tw } from "../shared/ui/tw";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import orderBy from "lodash/orderBy";
import baseUrl from "../config/api";
import FeedbackForm from "../features/feedback/components/FeedbackForm";
import FeedbackHistory from "../features/feedback/components/FeedbackHistory";
import CreateScoreForm from "../features/scores/components/CreateScoreForm";
import ScoreHistory from "../features/scores/components/ScoreHistory";
import StudentEvidenceSection from "../features/student-evidence/components/StudentEvidenceSection";
import { fetchStudentEvidences } from "../features/student-evidence/studentEvidenceApi";
import StudentLearningJournalSection from "../features/student-learning-journal/components/StudentLearningJournalSection";
import { fetchStudentLearningJournal } from "../features/student-learning-journal/studentLearningJournalApi";
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
  StudentContextHeader,
  TertiaryButton,
  WorkspacePanel,
  WorkspaceTabs,
} from "../shared/ui/ui";
import { useOfflineWorkspace } from "../offline-workspace/OfflineWorkspaceProvider";
import { loadStudentDetailWorkspace } from "../offline-workspace/studentDetailSnapshot";
import { mergeWorkspaceSnapshot } from "../offline-workspace/workspaceSnapshots";
import { useAttendanceOfflineRecords } from "../offline-workspace/attendanceOffline";
import AiNarrativeWorkspace from "../features/ai-learning-narrative/AiNarrativeWorkspace";
import { getAuthorizedClassName } from "../features/students/authorizedClass";
import { classAttendancePath } from "../navigation/workflowRoutes";
import { DEMO_READ_ONLY_MESSAGE } from "../auth/demoAccess";
import {
  RESOURCE_PROVENANCE,
  RESOURCE_STATUS,
  resourceConflicted,
  resourceFromData,
  resourceLoading,
  resourcePartial,
  resourcePending,
  resourceUnavailable,
  resourceError,
  summarizeResourceSet,
} from "../shared/data/resourceTruth";

const workspaceViews = Object.freeze([
  { id: "summary", label: "Ringkasan" },
  { id: "timeline", label: "Perjalanan" },
  { id: "assessment", label: "Penilaian" },
]);

function formatCachedAt(timestamp) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function timelineEventDate(event) {
  const value = new Date(event.date).getTime();
  return Number.isFinite(value) ? value : 0;
}

export default function StudentDetail({
  embedded = false,
  studentIdOverride,
  initialWorkspace = "summary",
  activeWorkspaceOverride,
  onWorkspaceChange,
} = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routeParams = useParams();
  const studentId = studentIdOverride || routeParams.studentId;
  const { isDemo, teacherIdentity, onlineHint } = useOfflineWorkspace();
  const student = useSelector((state) => state.students.student);
  const studentList = useSelector((state) => state.students.students);
  const [feedback, setFeedback] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState(() => resourceLoading({ data: [], scope: "feedback" }));
  const [evidenceTimelineResource, setEvidenceTimelineResource] = useState(() => resourceLoading({ data: [], scope: "evidence" }));
  const [journalTimelineResource, setJournalTimelineResource] = useState(() => resourceLoading({ data: [], scope: "journal" }));
  const [journalRefreshKey, setJournalRefreshKey] = useState(0);
  const [cachedSnapshot, setCachedSnapshot] = useState(null);
  const [usingCachedSnapshot, setUsingCachedSnapshot] = useState(false);
  const [aiWorkspaceOpen, setAiWorkspaceOpen] = useState(false);
  const [internalWorkspace, setInternalWorkspace] = useState(initialWorkspace);
  const [timelineTool, setTimelineTool] = useState("");
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(18);
  const [scoreComposerOpen, setScoreComposerOpen] = useState(false);
  const [classLookupAttemptedFor, setClassLookupAttemptedFor] = useState(null);
  const feedbackInputRef = useRef(null);
  const feedbackRequestSequence = useRef(0);
  const activeWorkspace = activeWorkspaceOverride || internalWorkspace;
  const setActiveWorkspace = useCallback((workspace) => {
    if (onWorkspaceChange) onWorkspaceChange(workspace);
    else setInternalWorkspace(workspace);
  }, [onWorkspaceChange]);
  const authorizedClassName = getAuthorizedClassName(student, studentList);
  const hasAttendanceProjection = Array.isArray(student?.Attendances);
  const hasAssessmentProjection = Array.isArray(student?.Scores);
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
    void "ISSA:CMS.FEEDBACK.FETCH_HISTORY";
    const requestId = ++feedbackRequestSequence.current;
    setFeedbackHistory((current) => resourceLoading({
      data: current.data || [],
      provenance: current.provenance,
      scope: "feedback",
    }));
    return fetch(`${baseUrl}/students/${studentId}/feedbacks`, {
      headers: { access_token: localStorage.access_token },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.msg || "Histori feedback gagal dimuat.");
        return body;
      })
      .then((body) => {
        if (requestId !== feedbackRequestSequence.current) return;
        const data = Array.isArray(body) ? orderBy(body, [
          (item) => new Date(item.observedAt || item.createdAt || 0).getTime(),
        ], ["desc"]) : [];
        setFeedbackHistory(resourceFromData(data, {
          provenance: RESOURCE_PROVENANCE.SERVER,
          scope: "feedback",
        }));
      })
      .catch((error) => {
        if (requestId !== feedbackRequestSequence.current) return;
        setFeedbackHistory(resourceError(error.message || "Histori feedback gagal dimuat.", {
          data: [],
          provenance: RESOURCE_PROVENANCE.SERVER,
          scope: "feedback",
        }));
      });
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    setUsingCachedSnapshot(false);
    setFeedbackHistory(resourceLoading({ data: [], scope: "feedback" }));

    loadStudentDetailWorkspace({
      teacherId: isDemo ? null : teacherIdentity?.id,
      studentId,
      onlineHint,
      fetchStudent: () => dispatch(fetchStudentDetail(studentId)),
    })
      .then((workspace) => {
        if (cancelled) return;
        const snapshotMode = workspace.source === "snapshot";
        setCachedSnapshot(workspace.snapshot);
        setUsingCachedSnapshot(snapshotMode);
        if (snapshotMode) {
          feedbackRequestSequence.current += 1;
          setFeedbackHistory(resourceUnavailable({
            data: [],
            provenance: RESOURCE_PROVENANCE.SNAPSHOT,
            scope: "feedback",
            reason: "Histori feedback tidak disimpan dalam snapshot offline minimum.",
          }));
          dispatch(storeStudentDetail(workspace.student));
        } else {
          fetchStudentFeedbackHistory();
        }
      })
      .catch((error) => {
        if (!cancelled) setDetailError(error.message || "Siswa tidak ditemukan.");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
      feedbackRequestSequence.current += 1;
    };
  }, [dispatch, fetchStudentFeedbackHistory, onlineHint, studentId, teacherIdentity?.id, isDemo]);

  useEffect(() => {
    if (!activeWorkspaceOverride) setInternalWorkspace(initialWorkspace);
  }, [activeWorkspaceOverride, initialWorkspace]);

  useEffect(() => {
    setTimelineTool("");
    setTimelineVisibleCount(18);
    setScoreComposerOpen(false);
    setClassLookupAttemptedFor(null);
    setEvidenceTimelineResource(resourceLoading({ data: [], scope: "evidence" }));
    setJournalTimelineResource(resourceLoading({ data: [], scope: "journal" }));
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
  }, [authorizedClassName, classLookupAttemptedFor, dispatch, onlineHint, student?.id]);

  const handleStudentFeedbackSubmit = (event) => {
    void "ISSA:CMS.FEEDBACK.SUBMIT_STUDENT_FEEDBACK";
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
    setSubmitting(true);
    setMessage("");
    dispatch(updateStudentRecord(studentId, payload))
      .then(() => {
        setObservedAt("");
        setMessage("Feedback berhasil diperbarui.");
        return fetchStudentFeedbackHistory();
      })
      .catch((error) => setMessage(error.message || "Feedback gagal diperbarui."))
      .finally(() => setSubmitting(false));
  };

  const handleEvidenceLoaded = useCallback((records, resourceState) => {
    const normalizedRecords = Array.isArray(records) ? records : [];
    setEvidenceTimelineResource(resourceState || resourceFromData(normalizedRecords, {
      provenance: RESOURCE_PROVENANCE.SERVER,
      scope: "evidence",
    }));
  }, []);

  const handleJournalLoaded = useCallback((entries, resourceState) => {
    const normalizedEntries = Array.isArray(entries) ? entries : [];
    const nextResource = resourceState || resourceFromData(normalizedEntries, {
      provenance: RESOURCE_PROVENANCE.SERVER,
      scope: "journal",
    });
    setJournalTimelineResource(nextResource);
    if (
      isDemo
      || !teacherIdentity?.id
      || nextResource.provenance !== RESOURCE_PROVENANCE.SERVER
    ) return undefined;
    return mergeWorkspaceSnapshot({
      teacherId: teacherIdentity.id,
      studentId,
      journalEntries: normalizedEntries,
    })
      .then((snapshot) => setCachedSnapshot(snapshot))
      .catch(() => {});
  }, [isDemo, studentId, teacherIdentity?.id]);

  useEffect(() => {
    if (!studentId || !onlineHint || usingCachedSnapshot) return undefined;
    const journalController = new AbortController();
    const evidenceController = new AbortController();
    setJournalTimelineResource(resourceLoading({ data: [], scope: "journal" }));
    setEvidenceTimelineResource(resourceLoading({ data: [], scope: "evidence" }));

    fetchStudentLearningJournal(studentId, { signal: journalController.signal })
      .then((entries) => handleJournalLoaded(entries, resourceFromData(entries, {
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "journal",
      })))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setJournalTimelineResource(resourceError(error?.message || "Jurnal belajar belum dapat dimuat.", {
          data: [],
          provenance: RESOURCE_PROVENANCE.SERVER,
          scope: "journal",
        }));
      });

    fetchStudentEvidences(studentId, { signal: evidenceController.signal })
      .then((records) => {
        const normalizedRecords = Array.isArray(records) ? records : [];
        setEvidenceTimelineResource(resourceFromData(normalizedRecords, {
          provenance: RESOURCE_PROVENANCE.SERVER,
          scope: "evidence",
        }));
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setEvidenceTimelineResource(resourceError(error?.message || "Bukti perkembangan belum dapat dimuat.", {
          data: [],
          provenance: RESOURCE_PROVENANCE.SERVER,
          scope: "evidence",
        }));
      });

    return () => {
      journalController.abort();
      evidenceController.abort();
    };
  }, [handleJournalLoaded, journalRefreshKey, onlineHint, studentId, usingCachedSnapshot]);

  useEffect(() => {
    if (!usingCachedSnapshot) return;
    const journalEntries = Array.isArray(cachedSnapshot?.journalEntries) ? cachedSnapshot.journalEntries : [];
    setJournalTimelineResource(resourcePartial(journalEntries, {
      provenance: RESOURCE_PROVENANCE.SNAPSHOT,
      scope: "journal",
      updatedAt: cachedSnapshot?.cachedAt || null,
      reason: "Jurnal berasal dari snapshot offline dan mungkin tidak mencakup perubahan terbaru.",
    }));
    setEvidenceTimelineResource(resourceUnavailable({
      data: [],
      provenance: RESOURCE_PROVENANCE.SNAPSHOT,
      scope: "evidence",
      reason: "Bukti mandiri tidak disimpan dalam snapshot offline minimum.",
    }));
  }, [cachedSnapshot?.cachedAt, cachedSnapshot?.journalEntries, usingCachedSnapshot]);

  const refreshStudentRecord = useCallback(() => (
    dispatch(fetchStudentDetail(studentId)).catch(() => {})
  ), [dispatch, studentId]);

  const handleAiDraftHandoff = useCallback((draftText) => {
    setFeedback(draftText);
    setMessage("Draf telah dipindahkan ke Feedback. Periksa kembali lalu simpan untuk membagikannya kepada orang tua.");
    window.requestAnimationFrame(() => {
      feedbackInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      feedbackInputRef.current?.focus();
    });
  }, []);

  const DetailContainer = embedded ? "div" : PageContainer;
  const detailClassName = embedded ? "student-record-embedded min-w-0 px-5 py-5 lg:px-7 lg:py-6" : "";

  if (detailLoading) return <DetailContainer className={tw(detailClassName)}><LoadingState label="Memuat detail siswa..." /></DetailContainer>;
  if (detailError) return <DetailContainer className={tw(detailClassName)}><ErrorState message={detailError} /><SecondaryButton className={tw("mt-4")} type="button" onClick={() => navigate("/students")}>Kembali ke Siswa</SecondaryButton></DetailContainer>;
  if (!student?.id) return <DetailContainer className={tw(detailClassName)}><EmptyState title="Siswa tidak ditemukan" description="Siswa ini tidak tersedia dalam cakupan guru." /></DetailContainer>;

  const attendances = orderBy(attendanceWorkspace.records, [(item) => String(item.attendanceDate || "")], ["desc"]);
  const scores = orderBy(student?.Scores || [], [(item) => String(item.recordedAt || item.createdAt || "")], ["desc"]);
  const evidenceTimelineRecords = Array.isArray(evidenceTimelineResource.data) ? evidenceTimelineResource.data : [];
  const journalTimelineRecords = Array.isArray(journalTimelineResource.data) ? journalTimelineResource.data : [];
  const feedbackRecords = Array.isArray(feedbackHistory.data) ? feedbackHistory.data : [];
  const hasAttendanceConflict = attendances.some((item) => item.syncState === "conflict");
  const hasPendingAttendance = attendances.some((item) => ["pending", "syncing", "failed"].includes(item.syncState));
  const attendanceResource = hasAttendanceConflict
    ? resourceConflicted(attendances, {
      scope: "attendance",
      reason: "Sebagian perubahan kehadiran memiliki konflik yang belum diselesaikan.",
    })
    : hasPendingAttendance
      ? resourcePending(attendances, {
        scope: "attendance",
        reason: "Sebagian perubahan kehadiran masih menunggu sinkronisasi.",
      })
      : usingCachedSnapshot
        ? resourcePartial(attendances, {
          provenance: RESOURCE_PROVENANCE.SNAPSHOT,
          scope: "attendance",
          updatedAt: cachedSnapshot?.cachedAt || null,
          reason: "Kehadiran berasal dari snapshot offline dan mungkin tidak mencakup perubahan server terbaru.",
        })
        : !hasAttendanceProjection
          ? resourceUnavailable({
            data: [],
            provenance: RESOURCE_PROVENANCE.SERVER,
            scope: "attendance",
            reason: "Detail siswa ini tidak menyertakan proyeksi histori kehadiran.",
          })
          : resourceFromData(attendances, {
            provenance: RESOURCE_PROVENANCE.SERVER,
            scope: "attendance",
          });
  const assessmentResource = usingCachedSnapshot
    ? resourceUnavailable({
      data: [],
      provenance: RESOURCE_PROVENANCE.SNAPSHOT,
      scope: "assessment",
      reason: "Penilaian tidak disimpan dalam snapshot offline minimum.",
    })
    : !hasAssessmentProjection
      ? resourceUnavailable({
        data: [],
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "assessment",
        reason: "Detail siswa ini tidak menyertakan proyeksi penilaian.",
      })
      : resourceFromData(scores, {
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "assessment",
      });
  const timelineTruth = summarizeResourceSet({
    attendance: attendanceResource,
    journal: journalTimelineResource,
    evidence: evidenceTimelineResource,
    feedback: feedbackHistory,
    assessment: assessmentResource,
  });
  const latestAttendance = attendances[0] || null;
  const latestScore = scores[0] || null;
  const latestFeedbackRecord = feedbackRecords[0];
  const usingLegacyFeedbackFallback = !latestFeedbackRecord && Boolean(student?.feedback);
  const latestTeacherInformation = latestFeedbackRecord?.content || student?.feedback || "";
  const journalEntries = orderBy(journalTimelineRecords, [(entry) => String(entry.observedAt || entry.createdAt || "")], ["desc"]);
  const recentJournalEntries = journalEntries.slice(0, 3);
  const timelineEvents = [
    ...attendances.map((attendance) => ({
      id: `attendance-${attendance.id || attendance.entityKey || attendance.attendanceDate}`,
      type: "Kehadiran",
      date: attendance.attendanceDate,
      title: attendance.status || "Kehadiran tercatat",
      detail: attendance.syncState && attendance.syncState !== "synced" ? `Perubahan ${attendance.syncState}` : "Status kehadiran",
      actionLabel: "Kelola di Kelas",
      actionTo: classAttendancePath({ studentId, studentName: student?.name || "", attendanceDate: attendance.attendanceDate }),
    })),
    ...journalEntries.map((entry) => ({
      id: `journal-${entry.id}`,
      type: "Catatan",
      date: entry.observedAt || entry.createdAt,
      title: entry.content || "Catatan guru",
      detail: entry.teacher?.name ? `Dicatat oleh ${entry.teacher.name}` : "Catatan perjalanan belajar",
    })),
    ...evidenceTimelineRecords.map((evidence) => ({
      id: `evidence-${evidence.id}`,
      type: "Bukti",
      date: evidence.observedAt || evidence.createdAt,
      title: evidence.title || "Bukti perkembangan",
      detail: evidence.description || "Bukti perkembangan siswa",
    })),
    ...feedbackRecords.map((item) => ({
      id: `feedback-${item.id}`,
      type: "Feedback",
      date: item.observedAt || item.createdAt,
      title: item.content || "Feedback guru",
      detail: item.Teacher?.name ? `Guru: ${item.Teacher.name}` : "Feedback tersimpan",
    })),
    ...scores.map((score) => ({
      id: `assessment-${score.id}`,
      type: "Penilaian",
      date: score.recordedAt || score.createdAt,
      title: `${score.Lesson?.name || "Penilaian"}: ${score.value ?? "—"}`,
      detail: [score.Assignment?.name, score.Lesson?.KKM != null ? `KKM ${score.Lesson.KKM}` : ""].filter(Boolean).join(" · ") || "Nilai siswa",
    })),
  ].filter((event) => event.date).sort((a, b) => timelineEventDate(b) - timelineEventDate(a));
  const visibleTimelineEvents = timelineEvents.slice(0, timelineVisibleCount);
  const hiddenTimelineEvents = Math.max(timelineEvents.length - visibleTimelineEvents.length, 0);
  const timelineSourceLabels = {
    attendance: "kehadiran",
    journal: "catatan",
    evidence: "bukti",
    feedback: "feedback",
    assessment: "penilaian",
  };
  const timelineSourceStatuses = timelineTruth.meta?.sourceStatuses || {};
  const degradedTimelineSources = Object.entries(timelineSourceStatuses)
    .filter(([, status]) => ![RESOURCE_STATUS.KNOWN, RESOURCE_STATUS.EMPTY].includes(status))
    .map(([key]) => timelineSourceLabels[key] || key);


  return (
    <DetailContainer className={tw(detailClassName)}>
      <StudentContextHeader
        student={student}
        classLabel={authorizedClassName}
        eyebrow="Siswa"
        headingLevel="h1"
        metadata={usingCachedSnapshot ? [{ label: "Data", value: "Snapshot offline" }] : []}
        actions={(
          <>
            {!embedded && <SecondaryButton type="button" onClick={() => navigate("/students")}>Siswa</SecondaryButton>}
            {usingCachedSnapshot ? (
              <PrimaryButton type="button" disabled>Kehadiran perlu online</PrimaryButton>
            ) : (
              <ButtonLink tone="primary" to={classAttendancePath({ studentId, studentName: student?.name || "" })}>Kelola kehadiran</ButtonLink>
            )}
          </>
        )}
      />

      {usingCachedSnapshot && (
        <InlineNotice className={tw("student-workspace-notice mt-4")} tone="warning">
          <strong>Data offline. </strong>
          <span>Snapshot dari {formatCachedAt(cachedSnapshot?.cachedAt)}. Hubungkan kembali untuk data terbaru.</span>
        </InlineNotice>
      )}

      <div className={tw(
        embedded
          ? "student-workspace-continuity sticky top-14 z-[14] -mx-5 mt-3 border-t border-issa-border bg-[color-mix(in_srgb,var(--issa-page)_96%,transparent)] backdrop-blur-lg lg:-mx-7 lg:top-[var(--teacher-utility-height)]"
          : "mt-3"
      )}>
        {embedded && (
          <div className={tw("flex min-w-0 items-center justify-between gap-3 border-b border-issa-border px-5 py-2 lg:hidden")}>
            <strong className={tw("min-w-0 truncate text-supporting font-semibold text-issa-text")}>{student?.name}</strong>
            <span className={tw("flex-none text-metadata text-issa-muted")}>{authorizedClassName || "Siswa"}</span>
          </div>
        )}
        <WorkspaceTabs
          className={tw("student-workspace-navigation")}
          items={workspaceViews}
          activeId={activeWorkspace}
          onChange={setActiveWorkspace}
          ariaLabel="Workspace siswa"
          idPrefix="student-workspace"
        />
      </div>

      {activeWorkspace === "summary" && (
        <WorkspacePanel id="student-workspace-summary" labelledBy="student-workspace-tab-summary" className={tw("student-overview")}>
          <div className={tw("grid min-w-0 gap-8 xl:[grid-template-columns:minmax(0,_1.15fr)_minmax(18rem,_0.85fr)]")}>
            <div className={tw("min-w-0")}>
              <SectionHeader title="Kondisi terbaru" />
              <dl className={tw("grid min-w-0 border-y border-issa-border sm:grid-cols-3 sm:divide-x sm:divide-issa-border")}>
                <div className={tw("px-0 py-4 sm:px-4 sm:first:pl-0 max-sm:border-b max-sm:border-issa-border")}>
                  <dt className={tw("text-metadata font-medium text-issa-muted")}>Kehadiran terakhir</dt>
                  <dd className={tw("mt-1 text-lg font-semibold text-issa-text")}>{latestAttendance?.status || "—"}</dd>
                  <p className={tw("mt-1 text-metadata text-issa-muted")}>{latestAttendance ? formatRecordedDate(latestAttendance.attendanceDate) : attendanceResource.status === RESOURCE_STATUS.PARTIAL ? "Tidak ada kehadiran dalam snapshot ini" : attendanceResource.status === RESOURCE_STATUS.UNAVAILABLE ? "Histori kehadiran tidak tersedia" : "Belum ada catatan kehadiran"}</p>
                </div>
                <div className={tw("px-0 py-4 sm:px-4 max-sm:border-b max-sm:border-issa-border")}>
                  <dt className={tw("text-metadata font-medium text-issa-muted")}>Penilaian terakhir</dt>
                  <dd className={tw("mt-1 text-lg font-semibold tabular-nums text-issa-text")}>{latestScore?.value ?? "—"}</dd>
                  <p className={tw("mt-1 text-metadata text-issa-muted")}>{latestScore ? [latestScore.Lesson?.name, latestScore.Assignment?.name].filter(Boolean).join(" · ") || "Penilaian tercatat" : assessmentResource.status === RESOURCE_STATUS.UNAVAILABLE ? assessmentResource.reason : "Belum ada nilai"}</p>
                </div>
                <div className={tw("px-0 py-4 sm:px-4")}>
                  <dt className={tw("text-metadata font-medium text-issa-muted")}>Observasi terakhir</dt>
                  <dd className={tw("mt-1 text-lg font-semibold text-issa-text")}>{recentJournalEntries[0] ? formatRecordedDate(recentJournalEntries[0].observedAt || recentJournalEntries[0].createdAt) : "—"}</dd>
                  <p className={tw("mt-1 text-metadata text-issa-muted")}>{recentJournalEntries[0]?.content || (journalTimelineResource.status === RESOURCE_STATUS.LOADING ? "Memuat observasi…" : journalTimelineResource.status === RESOURCE_STATUS.ERROR ? "Observasi belum dapat dimuat" : journalTimelineResource.status === RESOURCE_STATUS.PARTIAL ? "Tidak ada observasi dalam snapshot ini" : journalTimelineResource.status === RESOURCE_STATUS.EMPTY ? "Belum ada observasi" : "Observasi tidak tersedia")}</p>
                </div>
              </dl>

              <section className={tw("mt-8")}>
                <SectionHeader title="Observasi terbaru" />
                {journalTimelineResource.status === RESOURCE_STATUS.LOADING ? (
                  <LoadingState label="Memuat observasi terbaru..." />
                ) : journalTimelineResource.status === RESOURCE_STATUS.ERROR ? (
                  <InlineNotice tone="warning">Observasi terbaru belum dapat dimuat. Status ini bukan berarti histori siswa kosong.</InlineNotice>
                ) : journalTimelineResource.status === RESOURCE_STATUS.UNAVAILABLE ? (
                  <InlineNotice tone="warning">Observasi tidak tersedia dalam konteks data ini.</InlineNotice>
                ) : recentJournalEntries.length ? (
                  <>
                    {journalTimelineResource.status === RESOURCE_STATUS.PARTIAL && (
                      <InlineNotice className={tw("mb-3")} tone="warning" role="note">Catatan berikut berasal dari snapshot offline dan mungkin tidak lengkap.</InlineNotice>
                    )}
                    <ol className={tw("m-0 list-none border-t border-issa-border p-0")}>
                      {recentJournalEntries.map((entry) => (
                        <li className={tw("grid min-w-0 gap-2 border-b border-issa-border py-4 sm:[grid-template-columns:7.5rem_minmax(0,_1fr)]")} key={entry.id}>
                          <time className={tw("text-metadata text-issa-muted")} dateTime={entry.observedAt || entry.createdAt}>{formatRecordedDate(entry.observedAt || entry.createdAt)}</time>
                          <div className={tw("min-w-0")}>
                            <p className={tw("text-supporting leading-relaxed text-issa-text")}>{entry.content}</p>
                            <p className={tw("mt-1 text-metadata text-issa-muted")}>{entry.teacher?.name || "Guru"}{entry.evidence ? ` · Bukti: ${entry.evidence.title || "Bukti"}` : ""}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : journalTimelineResource.status === RESOURCE_STATUS.EMPTY ? (
                  <EmptyState title="Belum ada observasi" description="Server mengembalikan histori jurnal kosong untuk siswa ini." />
                ) : (
                  <EmptyState title="Tidak ada observasi dalam snapshot ini" description="Snapshot offline tidak membuktikan bahwa histori jurnal server kosong." />
                )}
              </section>
            </div>

            <aside className={tw("min-w-0 border-l border-issa-border pl-0 xl:pl-7 max-xl:border-l-0 max-xl:border-t max-xl:pt-6")}>
              <SectionHeader title="Feedback terakhir" />
              {feedbackHistory.status === RESOURCE_STATUS.LOADING && !latestTeacherInformation ? (
                <LoadingState label="Memuat feedback terbaru..." />
              ) : feedbackHistory.status === RESOURCE_STATUS.ERROR && !latestTeacherInformation ? (
                <InlineNotice tone="warning">Feedback terbaru gagal dimuat. Status ini bukan berarti belum ada feedback.</InlineNotice>
              ) : feedbackHistory.status === RESOURCE_STATUS.UNAVAILABLE && !latestTeacherInformation ? (
                <InlineNotice tone="warning">Histori feedback tidak tersedia dalam snapshot offline minimum.</InlineNotice>
              ) : feedbackHistory.status === RESOURCE_STATUS.EMPTY && !latestTeacherInformation ? (
                <p className={tw("text-body leading-relaxed text-issa-muted")}>Belum ada feedback guru yang tersimpan.</p>
              ) : (
                <>
                  {([RESOURCE_STATUS.ERROR, RESOURCE_STATUS.UNAVAILABLE, RESOURCE_STATUS.PARTIAL].includes(feedbackHistory.status) || usingLegacyFeedbackFallback) && (
                    <InlineNotice className={tw("mb-3")} tone="warning" role="note">Feedback di bawah berasal dari ringkasan siswa; histori detail belum dapat diverifikasi sebagai sumber yang sama.</InlineNotice>
                  )}
                  <p className={tw("whitespace-pre-wrap text-body leading-relaxed text-issa-text")}>{latestTeacherInformation}</p>
                </>
              )}
              {latestFeedbackRecord && (
                <p className={tw("mt-3 text-metadata text-issa-muted")}>{latestFeedbackRecord.Teacher?.name || "Guru"} · {formatRecordedDate(latestFeedbackRecord.observedAt || latestFeedbackRecord.createdAt)}</p>
              )}
              <div className={tw("mt-6 flex flex-wrap gap-2")}>
                <SecondaryButton type="button" onClick={() => setActiveWorkspace("timeline")}>Buka perjalanan</SecondaryButton>
                {!usingCachedSnapshot && <SecondaryButton type="button" onClick={() => setActiveWorkspace("assessment")}>Buka penilaian</SecondaryButton>}
              </div>
            </aside>
          </div>
        </WorkspacePanel>
      )}

      {activeWorkspace === "timeline" && (
        <WorkspacePanel id="student-workspace-timeline" labelledBy="student-workspace-tab-timeline" className={tw("student-timeline")}>
          <SectionHeader
            title="Perjalanan belajar"
            actions={<span className={tw("text-metadata font-medium text-issa-muted")}>{timelineEvents.length} aktivitas</span>}
          />

          {timelineTruth.status === RESOURCE_STATUS.LOADING && (
            <InlineNotice className={tw("mb-4")}>Sebagian riwayat masih dimuat. Jumlah aktivitas belum final.</InlineNotice>
          )}
          {[RESOURCE_STATUS.PARTIAL, RESOURCE_STATUS.PENDING, RESOURCE_STATUS.CONFLICTED].includes(timelineTruth.status) && (
            <InlineNotice className={tw("mb-4")} tone="warning" role="note">
              Perjalanan hanya mencakup sumber yang saat ini dapat dipercaya{degradedTimelineSources.length ? `; cakupan terbatas pada ${degradedTimelineSources.join(", ")}.` : "."}
            </InlineNotice>
          )}
          {timelineTruth.status === RESOURCE_STATUS.ERROR && (
            <InlineNotice className={tw("mb-4")} tone="warning" role="alert">Riwayat belum dapat diverifikasi karena sumber data gagal dimuat.</InlineNotice>
          )}
          {timelineTruth.status === RESOURCE_STATUS.UNAVAILABLE && (
            <InlineNotice className={tw("mb-4")} tone="warning" role="note">Riwayat lengkap tidak tersedia dalam konteks data ini.</InlineNotice>
          )}

          <section className={tw("min-w-0")} aria-labelledby="student-activity-title">
            <h3 id="student-activity-title" className={tw("sr-only")}>Aktivitas siswa</h3>
            {timelineEvents.length ? (
              <>
                <ol className={tw("m-0 list-none border-y border-issa-border p-0")}>
                  {visibleTimelineEvents.map((event) => (
                    <li key={event.id} className={tw("grid min-w-0 gap-2 border-b border-issa-border py-3.5 last:border-b-0 sm:[grid-template-columns:7.5rem_5.5rem_minmax(0,_1fr)] sm:gap-4")}>
                      <time className={tw("text-metadata tabular-nums text-issa-muted")} dateTime={event.date}>{formatRecordedDate(event.date)}</time>
                      <span className={tw("text-metadata font-semibold text-issa-accent")}>{event.type}</span>
                      <div className={tw("min-w-0")}>
                        <p className={tw("whitespace-pre-wrap text-supporting font-medium leading-relaxed text-issa-text")}>{event.title}</p>
                        <div className={tw("mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1")}>
                          <p className={tw("text-metadata leading-relaxed text-issa-muted")}>{event.detail}</p>
                          {event.actionTo && (
                            <ButtonLink
                              to={event.actionTo}
                              tone="tertiary"
                              compact
                              className={tw("!min-h-0 !p-0 !text-metadata hover:!bg-transparent")}
                            >
                              {event.actionLabel}
                            </ButtonLink>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                {hiddenTimelineEvents > 0 && (
                  <div className={tw("mt-3 flex justify-center")}>
                    <TertiaryButton type="button" onClick={() => setTimelineVisibleCount((current) => current + 18)}>
                      Tampilkan {Math.min(hiddenTimelineEvents, 18)} aktivitas berikutnya
                    </TertiaryButton>
                  </div>
                )}
              </>
            ) : timelineTruth.status === RESOURCE_STATUS.EMPTY ? (
              <EmptyState title="Belum ada aktivitas" description="Semua sumber yang tersedia telah dimuat dan belum memiliki aktivitas untuk siswa ini." />
            ) : timelineTruth.status === RESOURCE_STATUS.LOADING ? (
              <LoadingState label="Memuat perjalanan siswa..." />
            ) : [RESOURCE_STATUS.ERROR, RESOURCE_STATUS.UNAVAILABLE].includes(timelineTruth.status) ? (
              <EmptyState title="Aktivitas belum dapat dipastikan" description="Sumber yang diperlukan belum tersedia atau gagal dimuat, sehingga histori siswa belum dapat dinyatakan kosong." />
            ) : (
              <EmptyState title="Belum ada aktivitas pada sumber yang tersedia" description="Cakupan Perjalanan masih parsial, jadi kondisi ini tidak membuktikan bahwa seluruh histori siswa kosong." />
            )}
          </section>

          <section className={tw("mt-8 border-t border-issa-border pt-6")} aria-labelledby="student-record-actions-title">
            <div className={tw("flex min-w-0 items-center justify-between gap-4")}>
              <div className={tw("min-w-0")}>
                <h3 id="student-record-actions-title" className={tw("text-body font-semibold text-issa-text")}>Catat untuk siswa</h3>
                <p className={tw("mt-1 text-metadata text-issa-muted")}>Catatan, bukti, dan feedback tersimpan pada perjalanan siswa ini.</p>
              </div>
              {!usingCachedSnapshot && !timelineTool && (
                <Popover className={tw("relative flex-none")}>
                  {({ close }) => (
                    <>
                      <PopoverButton
                        className={tw("inline-flex min-h-control items-center gap-2 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-2 text-button font-semibold text-issa-text transition-colors duration-fast hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")}
                      >
                        <span aria-hidden="true">+</span>
                        Tambah
                      </PopoverButton>
                      <PopoverPanel
                        anchor={{ to: "bottom end", gap: 8, padding: 8 }}
                        portal
                        focus
                        className={tw("z-popover grid w-[min(18rem,calc(100vw-1rem))] gap-1 rounded-dialog border border-issa-border-strong bg-issa-surface p-1.5 shadow-dialog outline-none")}
                      >
                        {[
                          { id: "journal", label: "Catatan", detail: "Catat observasi atau refleksi siswa." },
                          { id: "evidence", label: "Bukti", detail: "Tambahkan bukti perkembangan siswa." },
                          { id: "feedback", label: "Feedback", detail: "Tulis feedback yang akan disimpan untuk siswa." },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={tw("grid min-w-0 gap-0.5 rounded-control px-3 py-2.5 text-left hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-1 focus-visible:outline-issa-focus")}
                            onClick={() => {
                              setTimelineTool(item.id);
                              close();
                            }}
                          >
                            <strong className={tw("text-supporting font-semibold text-issa-text")}>{item.label}</strong>
                            <span className={tw("text-metadata leading-relaxed text-issa-muted")}>{item.detail}</span>
                          </button>
                        ))}
                      </PopoverPanel>
                    </>
                  )}
                </Popover>
              )}
              {timelineTool && (
                <TertiaryButton type="button" compact onClick={() => setTimelineTool("")}>Tutup</TertiaryButton>
              )}
            </div>

            {usingCachedSnapshot && (
              <InlineNotice className={tw("mt-4")} tone="warning" role="note">
                Hubungkan kembali untuk menambah Catatan, Bukti, atau Feedback. Perjalanan yang tersimpan tetap dapat dibaca.
              </InlineNotice>
            )}

            {timelineTool === "journal" && !usingCachedSnapshot && (
              <div className={tw("mt-5 border-t border-issa-border pt-5")}>
                <StudentLearningJournalSection
                  studentId={studentId}
                  refreshKey={journalRefreshKey}
                  cachedEntries={cachedSnapshot?.journalEntries || []}
                  hasCachedSnapshot={Boolean(cachedSnapshot)}
                  demoReadOnly={isDemo}
                  offlineReadOnly={false}
                  onJournalLoaded={handleJournalLoaded}
                />
              </div>
            )}

            {timelineTool === "evidence" && !usingCachedSnapshot && (
              <div className={tw("mt-5 border-t border-issa-border pt-5")}>
                <StudentEvidenceSection
                  studentId={studentId}
                  demoReadOnly={isDemo}
                  onEvidenceChanged={() => setJournalRefreshKey((current) => current + 1)}
                  onEvidenceLoaded={handleEvidenceLoaded}
                />
              </div>
            )}

            {timelineTool === "feedback" && !usingCachedSnapshot && (
              <div className={tw("mt-5 border-t border-issa-border pt-5")}>
                <div className={tw("mb-4 flex items-start justify-between gap-4 max-sm:flex-col")}>
                  <div>
                    <h4 className={tw("text-supporting font-semibold text-issa-text")}>Feedback guru</h4>
                    <p className={tw("mt-1 max-w-[60ch] text-supporting text-issa-muted")}>AI hanya membantu menyusun draf. Data berubah setelah guru meninjau dan menyimpan.</p>
                  </div>
                  <SecondaryButton type="button" compact onClick={() => setAiWorkspaceOpen(true)}>Susun draf</SecondaryButton>
                </div>
                <div className={tw("grid min-w-0 items-start gap-5 xl:grid-cols-2")}>
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
              </div>
            )}
          </section>
        </WorkspacePanel>
      )}

      {activeWorkspace === "assessment" && (
        <WorkspacePanel id="student-workspace-assessment" labelledBy="student-workspace-tab-assessment" className={tw("student-assessment")}>
          <SectionHeader
            title="Penilaian"
            actions={!usingCachedSnapshot && (
              <div className={tw("flex items-center gap-3")}>
                <span className={tw("text-metadata font-medium text-issa-muted")}>{scores.length} nilai</span>
                <SecondaryButton type="button" compact onClick={() => setScoreComposerOpen((current) => !current)}>
                  {scoreComposerOpen ? "Tutup form" : "Catat nilai"}
                </SecondaryButton>
              </div>
            )}
          />
          {assessmentResource.status === RESOURCE_STATUS.UNAVAILABLE ? (
            <EmptyState title="Penilaian tidak tersedia" description={assessmentResource.reason} />
          ) : (
            <div className={tw("grid min-w-0 gap-7")}>
              {scoreComposerOpen && (
                <div className={tw("border-y border-issa-border py-5")}>
                  <CreateScoreForm studentId={student.id} onCreated={() => { refreshStudentRecord(); setScoreComposerOpen(false); }} />
                </div>
              )}
              <ScoreHistory scores={student.Scores} student={student} />
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
    </DetailContainer>
  );
}
