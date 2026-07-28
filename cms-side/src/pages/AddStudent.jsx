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
    <header className="student-record-identity">
      <div className="student-record-identity__main">
        {student?.imgUrl ? (
          <img
            className="student-record-identity__image"
            src={student.imgUrl}
            alt={student?.name || "Siswa"}
          />
        ) : (
          <div
            className="student-record-identity__image student-record-identity__initials"
            aria-hidden="true"
          >
            {(student?.name || "S").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="student-record-identity__copy">
          <p className="student-record-identity__eyebrow">Student development record</p>
          <h1>{student?.name || "Detail siswa"}</h1>
          <dl className="student-record-identity__metadata">
            <div>
              <dt>NIM</dt>
              <dd>{student?.NIM || "Belum tersedia"}</dd>
            </div>
            <div>
              <dt>Kelas</dt>
              <dd>{student?.Class?.name || "Kelas Anda"}</dd>
            </div>
            <div>
              <dt>Status workspace</dt>
              <dd>{usingCachedSnapshot ? "Record tersimpan" : "Record aktif"}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="student-record-identity__actions">
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
      <div className="student-case-file__offline-note" role="status">
        <strong>Workspace tersimpan</strong>
        <span>Data tersimpan dari {formatCachedAt(cachedSnapshot?.cachedAt)}. Hubungkan kembali untuk memperoleh data terbaru.</span>
      </div>
    )}

    <section
      className="student-development-summary"
      aria-labelledby="student-development-summary-title"
    >
      <div className="student-section-index" aria-hidden="true">01</div>
      <div className="student-development-summary__copy">
        <p className="student-section-kicker">Current understanding</p>
        <h2 id="student-development-summary-title">Ringkasan perkembangan</h2>
        <p className={student?.feedback ? "" : "is-limited"}>
          {student?.feedback || "Belum ada ringkasan perkembangan tersimpan. Tambahkan observasi faktual agar record ini memiliki konteks yang dapat ditinjau."}
        </p>
      </div>
      <dl className="student-development-summary__coverage" aria-label="Cakupan record">
        <div>
          <dt>Attendance</dt>
          <dd>{attendances.length ? `${attendances.length} record` : "Data terbatas"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{scores.length ? `${scores.length} record` : "Data terbatas"}</dd>
        </div>
      </dl>
    </section>

    <section className="student-record-section" aria-labelledby="student-context-title">
      <header className="student-record-section__heading">
        <div className="student-section-index" aria-hidden="true">02</div>
        <div>
          <p className="student-section-kicker">Supporting records</p>
          <h2 id="student-context-title">Konteks attendance dan akademik</h2>
          <span>Record pendukung memberi konteks tanpa menentukan kesimpulan siswa.</span>
        </div>
      </header>
      <div className="student-record-context">
        <Surface className="record-ledger record-ledger--attendance">
          <div className="record-ledger__header">
            <div>
              <p className="record-ledger__index">A / Attendance</p>
              <h3>Attendance record</h3>
              <span>Perbarui record yang sudah ada. Attendance baru tetap memerlukan koneksi.</span>
            </div>
            <strong>{attendances.length ? `${attendances.length} tercatat` : "Belum ada"}</strong>
          </div>
          <div className="record-ledger__body">
            {isEmpty(attendances) && (
              <EmptyState
                title="Belum ada attendance"
                description="Konteks kehadiran belum cukup untuk ditinjau."
              />
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
          <p className="record-ledger__status" aria-live="polite">
            {attendanceWorkspace.message}
          </p>
        </Surface>

        {usingCachedSnapshot ? (
          <Surface className="record-ledger record-ledger--score">
            <div className="record-ledger__body">
              <EmptyState
                title="Score memerlukan koneksi"
                description="Score tidak disimpan dalam workspace offline minimum."
              />
            </div>
          </Surface>
        ) : (
          <Surface className="record-ledger record-ledger--score">
            <div className="record-ledger__header">
              <div>
                <p className="record-ledger__index">B / Academic</p>
                <h3>Score record</h3>
                <span>Nilai dan KKM per assessment.</span>
              </div>
              <Link className="issa-button issa-button--secondary" to={`/scores/${studentId}`}>
                Kelola
              </Link>
            </div>
            <div className="record-ledger__body">
              {isEmpty(scores) && (
                <EmptyState
                  title="Belum ada score"
                  description="Konteks akademik belum cukup untuk ditinjau."
                />
              )}
              {scores.map((score) => (
                <article key={score.id} className="record-ledger__entry">
                  <div className="record-ledger__entry-copy">
                    <p>{score.Lesson?.name || "Lesson"}</p>
                    <span>{score.Assignment?.name || "Assessment"} · KKM {score.Lesson?.KKM ?? "-"}</span>
                    <time dateTime={score.recordedAt}>{formatRecordedDate(score.recordedAt)}</time>
                  </div>
                  <div className="record-ledger__value">
                    <strong>{score.value}</strong>
                    <StatusBadge status={scoreStatus(score.status)} />
                  </div>
                </article>
              ))}
            </div>
          </Surface>
        )}
      </div>
    </section>

    <section className="student-record-section" aria-labelledby="student-learning-records-title">
      <header className="student-record-section__heading">
        <div className="student-section-index" aria-hidden="true">03</div>
        <div>
          <p className="student-section-kicker">Observed learning</p>
          <h2 id="student-learning-records-title">Catatan dan bukti belajar</h2>
          <span>Observasi kronologis dibaca bersama dokumentasi yang mendukungnya.</span>
        </div>
      </header>
      <div className="student-learning-records">
        <StudentLearningJournalSection
          studentId={studentId}
          refreshKey={journalRefreshKey}
          cachedEntries={cachedSnapshot?.journalEntries || []}
          hasCachedSnapshot={Boolean(cachedSnapshot)}
          offlineReadOnly={usingCachedSnapshot}
          onJournalLoaded={handleJournalLoaded}
        />
        {usingCachedSnapshot ? (
          <Surface className="student-record-unavailable">
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

    <section className="student-record-section student-feedback-workflow" aria-labelledby="student-feedback-title">
      <header className="student-record-section__heading">
        <div className="student-section-index" aria-hidden="true">04</div>
        <div>
          <p className="student-section-kicker">Teacher-owned narrative</p>
          <h2 id="student-feedback-title">Tinjau dan simpan Feedback</h2>
          <span>Gunakan record di atas sebagai dasar. AI hanya membantu menyusun draf; keputusan akhir tetap pada guru.</span>
        </div>
      </header>
      {usingCachedSnapshot ? (
        <Surface className="student-record-unavailable">
          <EmptyState
            title="Feedback memerlukan koneksi"
            description="Feedback tidak disimpan dalam workspace offline minimum."
          />
        </Surface>
      ) : (
        <div className="student-feedback-workflow__grid">
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
