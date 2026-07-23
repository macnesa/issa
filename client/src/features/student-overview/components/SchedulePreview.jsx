import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';

export default function SchedulePreview({ resource, schedule, onRetry }) {
  return (
    <section className="overview-schedule-preview p-[1.35rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="overview-kicker">Struktur rutin</p><h2>Jadwal Mingguan</h2></div>
        <Link to="/schedule" className="text-link">Lihat jadwal</Link>
      </div>
      {resource.loading && <LoadingState label="Loading schedule..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !schedule && <EmptyState message="No schedule is available yet." />}
      {schedule && !resource.loading && !resource.error && (
        <div className="overview-schedule-preview__content mt-4">
          <p>{schedule.label}</p>
          <ul className="mt-3 grid list-none gap-2 p-0">
            {schedule.lessons.slice(0, 3).map((lesson) => <li key={lesson.id ?? lesson.name}>{lesson.name}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
