import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassSchedule } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import ScheduleList from '../features/schedule/components/ScheduleList';

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

  const scheduleByDay = useMemo(() => classSchedule.reduce((lessonNamesByDay, scheduleEntry) => {
    const scheduleDay = String(scheduleEntry.day || '').toLowerCase();
    if (!lessonNamesByDay[scheduleDay]) lessonNamesByDay[scheduleDay] = [];
    if (scheduleEntry.lesson?.name) lessonNamesByDay[scheduleDay].push(scheduleEntry.lesson.name);
    return lessonNamesByDay;
  }, {}), [classSchedule]);

  const scheduleDays = useMemo(() => Object.entries(scheduleByDay)
    .sort(([leftDay], [rightDay]) => {
      const leftIndex = dayOrder.indexOf(leftDay);
      const rightIndex = dayOrder.indexOf(rightDay);
      const leftOrder = leftIndex === -1 ? dayOrder.length : leftIndex;
      const rightOrder = rightIndex === -1 ? dayOrder.length : rightIndex;

      return leftOrder - rightOrder || leftDay.localeCompare(rightDay, 'id');
    }),
  [scheduleByDay]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat jadwal..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchClassSchedule())} /></main>;

  return (
    <main className="page-container grid items-start gap-5 sm:gap-6">
      <section className="relative pt-2 pb-[0.55rem]">
        <h1 className="page-title text-[clamp(1.7rem,5vw,2.25rem)]">Jadwal</h1>
        <p className="page-supporting-text mt-1">Jadwal mingguan untuk kelas siswa.</p>
      </section>

      {!scheduleDays.length ? (
        <EmptyState message="Belum ada jadwal yang tersedia." />
      ) : (
        <section className="grid gap-[0.8rem] min-[900px]:grid-cols-2">
          {scheduleDays.map(([scheduleDay, lessonNames]) => (
            <ScheduleList key={scheduleDay} day={dayLabels[scheduleDay] || scheduleDay} lessons={lessonNames} />
          ))}
        </section>
      )}
    </main>
  );
}
