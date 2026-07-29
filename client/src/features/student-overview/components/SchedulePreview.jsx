import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';

export default function SchedulePreview({ resource, schedule, onRetry }) {
  return (
    <section className="rounded-[0.85rem] border border-[#c9e8e7] bg-[#f8ffff] p-[1.35rem] max-[399px]:p-[1.15rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Struktur rutin</p><h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)]">Jadwal Mingguan</h2></div>
        <Link to="/schedule" className="text-link">Lihat jadwal</Link>
      </div>
      {resource.loading && <LoadingState label="Loading schedule..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !schedule && <EmptyState message="No schedule is available yet." />}
      {schedule && !resource.loading && !resource.error && (
        <div className="mt-4 text-[0.9rem] text-[#315f62] min-[900px]:relative min-[900px]:pl-[0.35rem]">
          <p className="m-0 font-extrabold min-[900px]:-ml-[0.35rem] min-[900px]:inline-flex min-[900px]:min-h-7 min-[900px]:items-center min-[900px]:rounded-r-[0.58rem] min-[900px]:bg-[rgba(107,191,188,0.2)] min-[900px]:px-[0.75rem] min-[900px]:py-[0.18rem] min-[900px]:text-[#285558]">{schedule.label}</p>
          <ul className="mt-3 grid list-none gap-2 p-0 min-[900px]:mt-2">
            {schedule.lessons.slice(0, 3).map((lesson, lessonIndex, lessons) => (
              <li className={`flex items-center gap-[0.55rem] font-semibold min-[900px]:min-h-8 min-[900px]:border-b min-[900px]:border-[rgba(107,191,188,0.18)] min-[900px]:pb-[0.48rem] min-[900px]:pt-[0.56rem] ${lessonIndex === lessons.length - 1 ? 'min-[900px]:border-b-0' : ''}`} key={lesson.id ?? lesson.name}>
                <span className="h-[0.45rem] w-[0.45rem] shrink-0 rounded-full bg-[#6bbfbc]" aria-hidden="true" />
                <span>{lesson.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
