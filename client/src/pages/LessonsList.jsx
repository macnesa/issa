import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassSchedule } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { PageContainer, PageHeader } from '../shared/ui/ui';
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
    }), [scheduleByDay]);

  if (loading) return <PageContainer><LoadingState label="Memuat jadwal..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={() => dispatch(fetchClassSchedule())} /></PageContainer>;

  return (
    <PageContainer className="page-grid">
      <PageHeader title="Jadwal" description="Jadwal mingguan untuk kelas siswa." />
      {!scheduleDays.length ? (
        <EmptyState message="Belum ada jadwal yang tersedia." />
      ) : (
        <section className="schedule-grid">
          {scheduleDays.map(([scheduleDay, lessonNames]) => (
            <ScheduleList
              key={scheduleDay}
              day={dayLabels[scheduleDay] || scheduleDay}
              lessons={lessonNames}
            />
          ))}
        </section>
      )}
    </PageContainer>
  );
}
