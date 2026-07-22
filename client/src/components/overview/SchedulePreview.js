import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../runtime/ResourceStates';

export default function SchedulePreview({ resource, schedule, onRetry }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-heading">Jadwal Mingguan</h2>
        <Link to="/schedule" className="text-link">Lihat jadwal</Link>
      </div>
      {resource.loading && <LoadingState label="Loading schedule..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !schedule && <EmptyState message="No schedule is available yet." />}
      {schedule && !resource.loading && !resource.error && (
        <div className="mt-3 text-sm text-[var(--issa-text-secondary)]">
          <p className="font-semibold text-[var(--issa-text)]">{schedule.label}</p>
          <ul className="mt-2 divide-y divide-[var(--issa-border)]">
            {schedule.lessons.slice(0, 3).map((lesson) => <li key={lesson.id ?? lesson.name} className="py-2 first:pt-0 last:pb-0">{lesson.name}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
