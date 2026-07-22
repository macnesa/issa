import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivity } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../components/runtime/ResourceStates';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EventPage() {
  const dispatch = useDispatch();
  const { activity: activityResource } = useSelector((state) => state.student);
  const { data: activity, loading, loaded, error } = activityResource;

  useEffect(() => {
    if (!loaded && !loading) dispatch(fetchActivity());
  }, [dispatch, loaded, loading]);

  const activities = useMemo(() => activity.slice().sort((left, right) => {
    const leftTimestamp = new Date(left.createdAt).getTime();
    const rightTimestamp = new Date(right.createdAt).getTime();
    const dateDifference = (Number.isNaN(rightTimestamp) ? Number.NEGATIVE_INFINITY : rightTimestamp)
      - (Number.isNaN(leftTimestamp) ? Number.NEGATIVE_INFINITY : leftTimestamp);

    return dateDifference || String(left.id ?? left.ActivityId ?? '').localeCompare(
      String(right.id ?? right.ActivityId ?? '')
    );
  }), [activity]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat aktivitas..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchActivity())} /></main>;

  return (
    <main className="page-container activities-page">
      <section className="editorial-page-heading activities-page__heading">
        <h1 className="page-title">Aktivitas</h1>
        <p className="page-supporting-text mt-1">Publikasi aktivitas terbaru dari kelas.</p>
      </section>

      {!activities.length ? (
        <EmptyState message="Belum ada aktivitas yang tersedia." />
      ) : (
        <section className="activities-page__feed">
          <ol>
            {activities.map((item) => (
              <li key={item.id ?? `${item.name}-${item.createdAt}`}>
                <h2>{item.name}</h2><time>Dipublikasikan {formatDate(item.createdAt)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
