import { useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassSchedule, fetchSchoolActivities } from '../store/actions/actionCreator';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { getLatestSchoolActivities, getTodayAttendance, getUpcomingWeeklySchedule } from '../features/student-overview/helpers';
import useJourneyHistory from '../features/parent-journey/useJourneyHistory';
import { buildJourneyEvents, formatParentDate } from '../features/parent-journey/parentJourney';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';

const storyTypeLabels = {
  journal: 'Catatan belajar',
  evidence: 'Bukti belajar',
  feedback: 'Catatan guru',
};

function TodayStatus({ attendance }) {
  return (
    <section className="parent-pulse-card parent-pulse-card--attendance">
      <span className="parent-pulse-card__eyebrow">Hari ini</span>
      <div className="parent-pulse-card__main">
        <div>
          <h2>{attendance?.status || 'Belum tercatat'}</h2>
          <p>{attendance ? 'Status kehadiran hari ini.' : 'Belum ada catatan kehadiran untuk hari ini.'}</p>
        </div>
        <span className={`parent-pulse-status parent-pulse-status--${String(attendance?.status || 'none').toLowerCase()}`}>
          {attendance?.status || '—'}
        </span>
      </div>
      <Link to="/attendance" className="parent-inline-link">Buka histori kehadiran</Link>
    </section>
  );
}

function Upcoming({ resource, schedule, onRetry }) {
  return (
    <section className="parent-pulse-card parent-pulse-card--upcoming">
      <span className="parent-pulse-card__eyebrow">Berikutnya</span>
      {resource.loading && <LoadingState label="Memuat jadwal..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {!resource.loading && !resource.error && !schedule && <EmptyState message="Belum ada jadwal yang tersedia." />}
      {schedule && !resource.loading && !resource.error && (
        <div className="parent-upcoming-day">
          <strong>{schedule.label}</strong>
          <ul>
            {schedule.lessons.slice(0, 4).map((lesson) => (
              <li key={lesson.id ?? lesson.name}>{lesson.name}</li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/schedule" className="parent-inline-link">Lihat jadwal</Link>
    </section>
  );
}

function LearningMoments({ events, profile, loading, failures }) {
  const fallbackFeedback = profile.feedback?.trim()
    ? {
      id: 'profile-feedback',
      type: 'feedback',
      title: 'Catatan wali kelas',
      detail: profile.feedback.trim(),
      teacherName: profile.teacherName || '',
      occurredAt: null,
    }
    : null;
  const visibleEvents = events.length > 0 ? events.slice(0, 3) : fallbackFeedback ? [fallbackFeedback] : [];

  return (
    <section className="parent-home-section parent-home-section--journey" aria-labelledby="home-learning-title">
      <header className="parent-home-section__header">
        <div>
          <span>Dari perjalanan</span>
          <h2 id="home-learning-title">Kabar belajar terbaru.</h2>
        </div>
        <Link to="/journey" className="parent-inline-link">Buka Perjalanan</Link>
      </header>

      {loading && events.length === 0 && !fallbackFeedback && (
        <div className="parent-soft-empty" role="status">Kabar belajar sedang dimuat…</div>
      )}

      {failures.length > 0 && (
        <div className="parent-home-partial" role="status">
          Sebagian kabar belum dapat dimuat: {failures.join(', ')}.
        </div>
      )}

      {visibleEvents.length > 0 ? (
        <div className="parent-home-story-grid">
          {visibleEvents.map((event) => {
            const evidence = event.evidence;
            const imageUrl = evidence?.availability !== 'retracted' ? evidence?.file?.url : null;
            return (
              <article key={event.id} className={`parent-home-story parent-home-story--${event.type}`}>
                {imageUrl && (
                  <div className="parent-home-story__media">
                    <img src={imageUrl} alt={evidence.title || 'Bukti belajar'} loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="parent-home-story__body">
                  <div className="parent-home-story__meta">
                    <span>{storyTypeLabels[event.type] || 'Perjalanan'}</span>
                    {event.occurredAt && <time dateTime={event.occurredAt}>{formatParentDate(event.occurredAt)}</time>}
                  </div>
                  <h3>{event.title}</h3>
                  {event.detail && (
                    event.type === 'feedback' || event.voiceCaptureType === 'direct_quote'
                      ? <blockquote>{event.voiceCaptureType === 'direct_quote' ? `“${event.detail}”` : event.detail}</blockquote>
                      : <p>{event.detail}</p>
                  )}
                  {event.teacherName && <small>{event.teacherName}</small>}
                </div>
              </article>
            );
          })}
        </div>
      ) : !loading && failures.length === 0 ? (
        <div className="parent-soft-empty">Belum ada kabar belajar terbaru.</div>
      ) : null}
    </section>
  );
}

function AssessmentPreview({ scores }) {
  const latestScores = scores
    .filter((score) => score?.value !== null && score?.value !== undefined && score?.value !== '')
    .slice()
    .sort((left, right) => new Date(right.recordedAt || 0).getTime() - new Date(left.recordedAt || 0).getTime())
    .slice(0, 2);

  return (
    <section className="parent-home-section parent-home-section--assessment" aria-labelledby="home-assessment-title">
      <header className="parent-home-section__header">
        <div>
          <span>Penilaian</span>
          <h2 id="home-assessment-title">Penilaian terbaru.</h2>
        </div>
        <Link to="/progress" className="parent-inline-link">Lihat semua penilaian</Link>
      </header>

      {latestScores.length > 0 ? (
        <div className="parent-home-assessment-list">
          {latestScores.map((score) => {
            const lessonId = score.lessonId ?? score.lesson?.id ?? null;
            return (
              <article key={score.id ?? `${lessonId}-${score.recordedAt}`} className="parent-home-assessment">
                <div>
                  <span>{score.lesson?.name || 'Mata pelajaran'}</span>
                  <h3>{score.assignment?.description || 'Penilaian'}</h3>
                  <time dateTime={score.recordedAt || undefined}>{formatParentDate(score.recordedAt)}</time>
                </div>
                <strong>{score.value}</strong>
                {lessonId && <Link to={`/progress/${lessonId}`} className="parent-inline-link">Buka detail</Link>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="parent-soft-empty">Belum ada penilaian yang tersedia.</div>
      )}
    </section>
  );
}

function SchoolNews({ activities, resource, onRetryActivity }) {
  return (
    <section className="parent-home-section parent-home-news" aria-labelledby="home-school-news-title">
      <header className="parent-home-section__header">
        <div>
          <span>Sekolah</span>
          <h2 id="home-school-news-title">Kabar sekolah.</h2>
        </div>
        <Link to="/schedule#school-news" className="parent-inline-link">Lihat semua kabar</Link>
      </header>

      {activities.length > 0 && (
        <div className="parent-home-news__list">
          {activities.map((activity) => (
            <article key={activity.id ?? `${activity.name}-${activity.createdAt}`} className="parent-latest-activity">
              <strong>{activity.name}</strong>
              <p>Dipublikasikan {formatParentDate(activity.createdAt)}</p>
            </article>
          ))}
        </div>
      )}

      {resource.loading && activities.length === 0 && (
        <div className="parent-soft-empty" role="status">Kabar sekolah sedang dimuat…</div>
      )}
      {resource.error && (
        <div className="parent-soft-empty" role="status">
          <span>Kabar sekolah belum dapat diperbarui.</span>{' '}
          <button type="button" className="parent-inline-link parent-inline-link--button" onClick={onRetryActivity}>Coba lagi</button>
        </div>
      )}
      {activities.length === 0 && !resource.loading && !resource.error && (
        <div className="parent-soft-empty">Belum ada kabar sekolah terbaru.</div>
      )}
    </section>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const {
    studentEvidenceRefreshKey = 0,
    studentInsightsRefreshKey = 0,
    studentJournalRefreshKey = 0,
  } = useOutletContext() || {};
  const { studentDetail, classSchedule, activity } = useSelector((state) => state.student);
  const studentOverview = studentDetail.data;
  const studentId = studentOverview.profile.id;

  useEffect(() => {
    if (!classSchedule.loaded && !classSchedule.loading) dispatch(fetchClassSchedule());
    if (!activity.loaded && !activity.loading) dispatch(fetchSchoolActivities());
  }, [activity.loaded, activity.loading, classSchedule.loaded, classSchedule.loading, dispatch]);

  const history = useJourneyHistory(
    studentId,
    `${studentEvidenceRefreshKey}:${studentInsightsRefreshKey}:${studentJournalRefreshKey}`,
  );
  const todayAttendance = useMemo(() => getTodayAttendance(studentOverview.attendance), [studentOverview.attendance]);
  const upcomingSchedule = useMemo(() => getUpcomingWeeklySchedule(classSchedule.data), [classSchedule.data]);
  const latestActivities = useMemo(() => getLatestSchoolActivities(activity.data, 3), [activity.data]);
  const learningEvents = useMemo(() => buildJourneyEvents({
    journal: history.journal.data,
    evidences: history.evidence.data,
    feedback: history.feedback.data,
    evidenceLoaded: history.evidence.status === 'success',
  }), [history.evidence.data, history.evidence.status, history.feedback.data, history.journal.data]);
  const learningFailures = [
    history.journal.status === 'error' ? 'catatan belajar' : null,
    history.evidence.status === 'error' ? 'bukti belajar' : null,
    history.feedback.status === 'error' ? 'catatan guru' : null,
  ].filter(Boolean);
  const learningLoading = [history.journal.status, history.evidence.status, history.feedback.status]
    .some((status) => status === 'loading');

  return (
    <main id="parent-main-content" tabIndex={-1} className="page-container parent-new-page parent-today-page">
      <StudentIdentity profile={studentOverview.profile} />

      <header className="parent-new-heading parent-new-heading--today">
        <span>Hari ini</span>
        <h1>Kabar {studentOverview.profile.name?.split(' ')[0] || 'anak Anda'} hari ini.</h1>
        <p>Satu tempat untuk melihat apa yang terjadi sekarang, momen belajar terbaru, dan yang akan datang.</p>
      </header>

      <div className="parent-home-now-grid">
        <TodayStatus attendance={todayAttendance} />
        <Upcoming resource={classSchedule} schedule={upcomingSchedule} onRetry={() => dispatch(fetchClassSchedule())} />
      </div>

      <LearningMoments
        events={learningEvents}
        profile={studentOverview.profile}
        loading={learningLoading}
        failures={learningFailures}
      />

      <AssessmentPreview scores={studentOverview.scores} />

      <SchoolNews
        activities={latestActivities}
        resource={activity}
        onRetryActivity={() => dispatch(fetchSchoolActivities())}
      />
    </main>
  );
}
