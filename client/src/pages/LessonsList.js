import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassSchedule } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../components/runtime/ResourceStates';
import ScheduleList from '../components/ScheduleList';

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
  const dispatch = useDispatch();
  const { classSchedule: scheduleResource } = useSelector((state) => state.student);
  const { data: classSchedule, loading, loaded, error } = scheduleResource;

  useEffect(() => {
    if (!loaded && !loading) dispatch(fetchClassSchedule());
  }, [dispatch, loaded, loading]);

  const scheduleByDay = useMemo(() => classSchedule.reduce((days, item) => {
    const day = String(item.day || '').toLowerCase();
    if (!days[day]) days[day] = [];
    if (item.lesson?.name) days[day].push(item.lesson.name);
    return days;
  }, {}), [classSchedule]);

  const days = useMemo(() => Object.entries(scheduleByDay)
    .sort(([left], [right]) => {
      const leftIndex = dayOrder.indexOf(left);
      const rightIndex = dayOrder.indexOf(right);
      const leftOrder = leftIndex === -1 ? dayOrder.length : leftIndex;
      const rightOrder = rightIndex === -1 ? dayOrder.length : rightIndex;

      return leftOrder - rightOrder || left.localeCompare(right, 'id');
    }),
  [scheduleByDay]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat jadwal..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchClassSchedule())} /></main>;

  return (
    <main className="page-container schedule-page">
      <section className="editorial-page-heading schedule-page__heading">
        <h1 className="page-title">Jadwal</h1>
        <p className="page-supporting-text mt-1">Jadwal mingguan untuk kelas siswa.</p>
      </section>

      {!days.length ? (
        <EmptyState message="Belum ada jadwal yang tersedia." />
      ) : (
        <section className="schedule-page__list">
          {days.map(([day, lessons]) => (
            <ScheduleList key={day} day={dayLabels[day] || day} lessons={lessons} />
          ))}
        </section>
      )}
    </main>
  );
}
