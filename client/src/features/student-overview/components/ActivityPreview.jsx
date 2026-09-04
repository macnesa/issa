import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';
import { SectionHeader, Surface } from '../../../shared/ui/ui';

function formatActivityPublicationDate(activityDate) {
  const date = new Date(activityDate);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityPreview({ resource, activities, onRetry }) {
  return (
    <Surface className="activity-preview-surface">
      <SectionHeader
        kicker="Kabar sekolah"
        title="Aktivitas Terbaru"
        action={<Link to="/activities" className="text-link">Lihat aktivitas</Link>}
      />
      {resource.loading && <LoadingState label="Memuat aktivitas..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !activities.length && <EmptyState message="Belum ada aktivitas yang tersedia." />}
      {!!activities.length && !resource.loading && !resource.error && (
        <ol className="activity-list activity-list--preview">
          {activities.map((activity) => (
            <li key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
              <span className="activity-list__marker" aria-hidden="true" />
              <div>
                <strong>{activity.name}</strong>
                <time>{formatActivityPublicationDate(activity.createdAt)}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  );
}
