import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../runtime/ResourceStates';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityPreview({ resource, activities, onRetry }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-heading">Aktivitas Terbaru</h2>
        <Link to="/activities" className="text-link">Lihat aktivitas</Link>
      </div>
      {resource.loading && <LoadingState label="Loading activities..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !activities.length && <EmptyState message="No activities are available yet." />}
      {!!activities.length && !resource.loading && !resource.error && (
        <ol className="mt-3 divide-y divide-[var(--issa-border)]">
          {activities.map((item) => (
            <li key={item.id ?? `${item.name}-${item.createdAt}`} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-[var(--issa-text)]">{item.name}</p>
              <time className="mt-0.5 block text-xs text-[var(--issa-text-muted)]">{formatDate(item.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
