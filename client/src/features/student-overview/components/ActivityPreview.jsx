import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';

function formatActivityPublicationDate(activityDate) {
  const date = new Date(activityDate);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityPreview({ resource, activities, onRetry }) {
  return (
    <section className="overview-activity-preview p-[1.35rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="overview-kicker">Kabar sekolah</p><h2>Aktivitas Terbaru</h2></div>
        <Link to="/activities" className="text-link">Lihat aktivitas</Link>
      </div>
      {resource.loading && <LoadingState label="Loading activities..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !activities.length && <EmptyState message="No activities are available yet." />}
      {!!activities.length && !resource.loading && !resource.error && (
        <ol className="overview-activity-preview__list mt-4 grid list-none gap-[0.85rem] p-0">
          {activities.map((activity) => (
            <li key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
              <p>{activity.name}</p>
              <time>{formatActivityPublicationDate(activity.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
