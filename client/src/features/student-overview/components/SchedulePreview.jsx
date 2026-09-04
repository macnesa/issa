import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';
import { SectionHeader, Surface } from '../../../shared/ui/ui';

export default function SchedulePreview({ resource, schedule, onRetry }) {
  return (
    <Surface className="schedule-preview-surface">
      <SectionHeader
        kicker="Struktur rutin"
        title="Jadwal Mingguan"
        action={<Link to="/schedule" className="text-link">Lihat jadwal</Link>}
      />
      {resource.loading && <LoadingState label="Memuat jadwal..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !schedule && <EmptyState message="Belum ada jadwal yang tersedia." />}
      {schedule && !resource.loading && !resource.error && (
        <div className="schedule-preview">
          <strong>{schedule.label}</strong>
          <ul className="record-list">
            {schedule.lessons.slice(0, 3).map((lesson) => (
              <li className="history-record" key={lesson.id ?? lesson.name}>
                <span className="schedule-preview__marker" aria-hidden="true" />
                <strong className="history-record__title">{lesson.name}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Surface>
  );
}
