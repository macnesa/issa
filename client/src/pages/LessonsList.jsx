import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassSchedule, fetchSchoolActivities } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { formatParentDate } from '../features/parent-journey/parentJourney';

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
};

export default function LessonsList() {
  const location = useLocation();
  const newsRef = useRef(null);
  const [newsCount, setNewsCount] = useState(8);
  const dispatch = useDispatch();
  const { classSchedule, activity, studentDetail } = useSelector((state) => state.student);

  useEffect(() => {
    if (location.hash !== '#school-news' || !classSchedule.loaded || classSchedule.loading) return;
    const frame = requestAnimationFrame(() => {
      newsRef.current?.scrollIntoView({ block: 'start' });
      newsRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash, classSchedule.loaded, classSchedule.loading]);

  useEffect(() => {
    if (!classSchedule.loaded && !classSchedule.loading) dispatch(fetchClassSchedule());
    if (!activity.loaded && !activity.loading) dispatch(fetchSchoolActivities());
  }, [activity.loaded, activity.loading, classSchedule.loaded, classSchedule.loading, dispatch]);

  const scheduleDays = useMemo(() => {
    const grouped = classSchedule.data.reduce((result, entry) => {
      const day = String(entry.day || '').toLowerCase();
      if (!result[day]) result[day] = [];
      if (entry.lesson?.name) result[day].push(entry.lesson);
      return result;
    }, {});

    return Object.entries(grouped).sort(([left], [right]) => {
      const leftIndex = dayOrder.indexOf(left);
      const rightIndex = dayOrder.indexOf(right);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
  }, [classSchedule.data]);

  const activities = useMemo(() => activity.data.slice().sort((left, right) => {
    const rightTime = new Date(right.createdAt).getTime();
    const leftTime = new Date(left.createdAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), [activity.data]);

  return (
    <main id="parent-main-content" tabIndex={-1} className="page-container parent-new-page parent-schedule-page">
      <StudentIdentity profile={studentDetail.data.profile} compact />
      <header className="parent-new-heading">
        <span>Jadwal</span>
        <h1>Jadwal dan kabar sekolah.</h1>
        <p>Rutinitas kelas dan kabar sekolah tersedia dalam satu tempat.</p>
      </header>

      <section className="parent-schedule-section" aria-labelledby="weekly-schedule-heading">
        <div className="parent-section-title">
          <span>Mingguan</span>
          <h2 id="weekly-schedule-heading">Jadwal kelas</h2>
        </div>
        {classSchedule.loading && <LoadingState label="Memuat jadwal..." />}
        {classSchedule.error && <ErrorState error={classSchedule.error} onRetry={() => dispatch(fetchClassSchedule())} />}
        {!classSchedule.loading && !classSchedule.error && scheduleDays.length === 0 && <EmptyState message="Belum ada jadwal yang tersedia." />}
        {scheduleDays.length > 0 && !classSchedule.loading && !classSchedule.error && (
          <div className="parent-week-grid">
            {scheduleDays.map(([day, lessons]) => (
              <article className="parent-day-card" key={day}>
                <h3>{dayLabels[day] || day}</h3>
                <ol>
                  {lessons.map((lesson, index) => (
                    <li key={lesson.id ?? `${lesson.name}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{lesson.name}</strong>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="school-news" ref={newsRef} tabIndex={-1} className="parent-school-news" aria-labelledby="school-news-heading">
        <div className="parent-section-title">
          <span>Sekolah</span>
          <h2 id="school-news-heading">Kabar sekolah</h2>
        </div>
        {activity.loading && <LoadingState label="Memuat kabar sekolah..." />}
        {activity.error && <ErrorState error={activity.error} onRetry={() => dispatch(fetchSchoolActivities())} />}
        {!activity.loading && !activity.error && activities.length === 0 && <EmptyState message="Belum ada kabar sekolah yang tersedia." />}
        {activities.length > 0 && !activity.loading && !activity.error && (
          <ol className="parent-school-news__list">
            {activities.slice(0, newsCount).map((item, index) => (
              <li key={item.id ?? `${item.name}-${item.createdAt}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{item.name}</strong>
                  <time dateTime={item.createdAt}>Dipublikasikan {formatParentDate(item.createdAt)}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
        {!activity.loading && !activity.error && newsCount < activities.length && (
          <button type="button" className="secondary-button" onClick={() => setNewsCount((count) => count + 8)}>Lihat kabar sebelumnya</button>
        )}
      </section>
    </main>
  );
}
