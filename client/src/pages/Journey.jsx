import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useJourneyHistory from '../features/parent-journey/useJourneyHistory';
import EvidenceViewer from '../features/student-evidence/components/EvidenceViewer';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { buildJourneyEvents, formatParentDate } from '../features/parent-journey/parentJourney';
import { Button, PageContainer } from '../shared/ui/ui';

const typeLabels = {
  journal: 'Catatan',
  evidence: 'Bukti',
  feedback: 'Catatan guru',
  assessment: 'Penilaian',
  attendance: 'Kehadiran',
};

function JourneyEvent({ event, onOpenEvidence }) {
  const evidence = event.evidence;
  const [failedUrl, setFailedUrl] = useState(null);
  const hasImage = evidence && evidence.availability !== 'retracted' && evidence.file?.url;

  return (
    <li className={`parent-journey-event parent-journey-event--${event.type}`}>
      <div className="parent-journey-event__date">
        <time dateTime={event.occurredAt || undefined}>{formatParentDate(event.occurredAt)}</time>
      </div>
      <article className="parent-journey-event__card">
        <header>
          <span className="parent-journey-event__type">{typeLabels[event.type] || 'Perjalanan'}</span>
          {event.type === 'assessment' && event.value !== null && event.value !== undefined && (
            <strong className="parent-journey-event__score">{event.value}</strong>
          )}
        </header>
        <h2>{event.title}</h2>
        {event.voiceCaptureType && <small>{event.voiceCaptureType === 'direct_quote' ? 'Kutipan langsung anak' : 'Dirangkum oleh guru'}</small>}
        {event.detail && (
          event.type === 'feedback' || event.voiceCaptureType === 'direct_quote'
            ? <blockquote>{event.voiceCaptureType === 'direct_quote' ? `“${event.detail}”` : event.detail}</blockquote>
            : <p>{event.detail}</p>
        )}
        {event.wasEdited && <small>Catatan diperbarui</small>}
        {event.teacherName && <small>Dicatat oleh {event.teacherName}</small>}

        {hasImage && failedUrl !== evidence.file.url && (
          <button
            type="button"
            className="parent-journey-event__evidence"
            onClick={(click) => onOpenEvidence(evidence, click.currentTarget)}
            aria-label={`Buka dokumentasi ${evidence.title || 'belajar'}`}
          >
            <img src={evidence.file.url} alt={evidence.title || 'Bukti belajar'} loading="lazy" decoding="async" onError={() => setFailedUrl(evidence.file.url)} />
            <span>
              <strong>{evidence.title || 'Lihat bukti belajar'}</strong>
              <small>Buka dokumentasi</small>
            </span>
          </button>
        )}
        {evidence && (!hasImage || failedUrl === evidence.file?.url) && (
          <p role="status">{evidence.availability === 'retracted'
            ? 'Dokumentasi terkait telah ditarik oleh sekolah.'
            : 'Gambar dokumentasi belum dapat ditampilkan.'}</p>
        )}

        {event.type === 'assessment' && event.lessonId && (
          <Link className="parent-inline-link" to={`/progress/${event.lessonId}`}>Lihat detail penilaian</Link>
        )}
      </article>
    </li>
  );
}

function PartialNotice({ failures }) {
  if (!failures.length) return null;
  return (
    <div className="parent-partial-notice" role="status">
      <strong>Sebagian perjalanan belum dapat dimuat.</strong>
      <span>{failures.join(', ')} sedang tidak tersedia. Data yang sudah berhasil dimuat tetap ditampilkan.</span>
    </div>
  );
}

export default function Journey() {
  const { studentInsightsRefreshKey = 0, studentEvidenceRefreshKey = 0, studentJournalRefreshKey = 0 } = useOutletContext() || {};
  const studentOverview = useSelector((state) => state.student.studentDetail.data);
  const studentId = studentOverview.profile.id;
  const [selectedId, setSelectedId] = useState(null);
  const headingRef = useRef(null);
  const openerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [retryKey, setRetryKey] = useState(0);
  const { journal, evidence, feedback } = useJourneyHistory(studentId,
    `${retryKey}:${studentEvidenceRefreshKey}:${studentInsightsRefreshKey}:${studentJournalRefreshKey}`);

  useEffect(() => {
    setVisibleCount(12);
    setSelectedId(null);
  }, [studentId]);

  const events = useMemo(() => buildJourneyEvents({
    attendance: studentOverview.attendance,
    scores: studentOverview.scores,
    journal: journal.data,
    evidences: evidence.data,
    feedback: feedback.data,
    evidenceLoaded: evidence.status === 'success',
  }), [evidence.data, evidence.status, feedback.data, journal.data, studentOverview.attendance, studentOverview.scores]);

  const selectedEvidence = selectedId === null ? null : events.map((event) => event.evidence)
    .find((item) => item && String(item.id) === String(selectedId)
      && item.availability !== 'retracted' && item.file?.url) || null;
  useEffect(() => {
    if (selectedId !== null && (!selectedEvidence || evidence.status === 'error')) {
      setSelectedId(null);
      requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    }
  }, [selectedId, selectedEvidence, evidence.status]);

  function closeViewer() {
    setSelectedId(null);
    requestAnimationFrame(() => {
      const target = openerRef.current?.isConnected ? openerRef.current : headingRef.current;
      target?.focus({ preventScroll: true });
    });
  }

  const failures = [
    journal.status === 'error' ? 'Catatan belajar' : null,
    evidence.status === 'error' ? 'Bukti belajar' : null,
    feedback.status === 'error' ? 'Catatan guru' : null,
  ].filter(Boolean);
  const isLoading = [journal.status, evidence.status, feedback.status].some((status) => status === 'loading');
  const visibleEvents = events.slice(0, visibleCount);

  return (
    <PageContainer className="parent-new-page parent-journey-page">
      <StudentIdentity profile={studentOverview.profile} compact />

      <header className="parent-new-heading">
        <span>Perjalanan</span>
        <h1 ref={headingRef} tabIndex={-1}>Cerita belajar {studentOverview.profile.name?.split(' ')[0] || 'anak Anda'}.</h1>
        <p>Catatan guru, suara anak, dan hasil belajarnya dari waktu ke waktu.</p>
        <div className="parent-journey-utilities">
          <Link className="parent-inline-link" to="/attendance">Histori kehadiran</Link>
          <Link className="parent-inline-link" to="/progress">Semua penilaian</Link>
        </div>
      </header>

      <PartialNotice failures={failures} />

      {journal.data.length >= 50 && (
        <div className="parent-partial-notice" role="status">
          <strong>Catatan belajar mencakup 50 catatan terbaru.</strong>
          <span>Catatan belajar yang lebih lama belum tersedia di halaman ini. Riwayat lain tetap ditampilkan sesuai data yang tersedia.</span>
        </div>
      )}

      {isLoading && (
        <div className="parent-journey-loading" role="status">Menyusun perjalanan terbaru…</div>
      )}

      {!isLoading && events.length === 0 && failures.length === 0 && (
        <div className="parent-journey-empty">
          <strong>Perjalanan belajar akan muncul di sini.</strong>
          <span>Belum ada catatan, bukti, penilaian, atau kehadiran yang tersedia.</span>
        </div>
      )}

      {visibleEvents.length > 0 && (
        <ol className="parent-journey-list">
          {visibleEvents.map((event) => (
            <JourneyEvent key={event.id} event={event} onOpenEvidence={(item, opener) => {
              openerRef.current = opener;
              setSelectedId(item.id);
            }} />
          ))}
        </ol>
      )}

      {visibleCount < events.length && (
        <div className="parent-journey-more">
          <Button variant="secondary" onClick={() => setVisibleCount((current) => current + 12)}>
            Tampilkan perjalanan sebelumnya
          </Button>
        </div>
      )}

      {failures.length > 0 && (
        <div className="parent-journey-retry">
          <Button variant="secondary" onClick={() => setRetryKey((current) => current + 1)}>Coba muat lagi</Button>
        </div>
      )}

      <EvidenceViewer evidence={evidence.status === 'error' ? null : selectedEvidence} onClose={closeViewer} />
    </PageContainer>
  );
}
