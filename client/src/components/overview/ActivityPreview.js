import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../runtime/ResourceStates';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityPreview({ resource, activities, onRetry }) {
  return (
    <section className="overview-activity-preview">
      <div className="flex items-center justify-between gap-4">
        <div><p className="overview-kicker">Kabar sekolah</p><h2>Aktivitas Terbaru</h2></div>
        <Link to="/activities" className="text-link">Lihat aktivitas</Link>
      </div>
      {resource.loading && <LoadingState label="Loading activities..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !activities.length && <EmptyState message="No activities are available yet." />}
      {!!activities.length && !resource.loading && !resource.error && (
        <ol className="overview-activity-preview__list">
          {activities.map((item) => (
            <li key={item.id ?? `${item.name}-${item.createdAt}`}>
              <p>{item.name}</p>
              <time>{formatDate(item.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
