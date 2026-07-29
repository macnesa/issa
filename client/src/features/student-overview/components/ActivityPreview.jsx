import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/ResourceStates';

function formatActivityPublicationDate(activityDate) {
  const date = new Date(activityDate);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityPreview({ resource, activities, onRetry }) {
  return (
    <section className="rounded-[0.85rem_0.85rem_2.5rem_0.85rem] border border-[#eed8dd] bg-[#fff7f8] p-[1.35rem] max-[399px]:p-[1.15rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Kabar sekolah</p><h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)]">Aktivitas Terbaru</h2></div>
        <Link to="/activities" className="text-link">Lihat aktivitas</Link>
      </div>
      {resource.loading && <LoadingState label="Loading activities..." />}
      {resource.error && <ErrorState error={resource.error} onRetry={onRetry} />}
      {resource.loaded && !activities.length && <EmptyState message="No activities are available yet." />}
      {!!activities.length && !resource.loading && !resource.error && (
        <ol className="mt-4 grid list-none gap-[0.85rem] p-0 min-[900px]:mt-[1.05rem] min-[900px]:gap-0 min-[900px]:border-l min-[900px]:border-[#f1cdd5] min-[900px]:pl-[0.1rem]">
          {activities.map((activity) => (
            <li className="relative pl-[1.1rem] min-[900px]:grid min-[900px]:min-h-[3.6rem] min-[900px]:grid-cols-[minmax(5.4rem,0.6fr)_minmax(0,1.4fr)] min-[900px]:gap-[0.75rem] min-[900px]:pb-[0.72rem] min-[900px]:pl-4 min-[900px]:pt-[0.2rem]" key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
              <span
                className="absolute left-0 top-[0.38rem] h-2 w-2 rounded-full bg-[#d28a9a] min-[900px]:-left-[0.32rem] min-[900px]:top-[0.48rem]"
                style={{ boxShadow: '0 0 0 0.2rem #fdebed' }}
                aria-hidden="true"
              />
              <p className="m-0 text-[0.9rem] font-bold text-[#573b45] min-[900px]:col-start-2 min-[900px]:row-start-1">{activity.name}</p>
              <time className="mt-1 block text-[0.76rem] text-[#9a6b77] min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:mt-[0.12rem] min-[900px]:font-bold min-[900px]:leading-[1.35]">{formatActivityPublicationDate(activity.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
