import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchoolActivities } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';

function formatActivityPublicationDate(activityDate) {
  const date = new Date(activityDate);
  if (Number.isNaN(date.getTime())) return 'Tanggal publikasi belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EventPage() {
  const dispatch = useDispatch();
  const { activity: activityResource } = useSelector((state) => state.student);
  const { data: schoolActivities, loading, loaded, error } = activityResource;

  useEffect(() => {
    if (!loaded && !loading) dispatch(fetchSchoolActivities());
  }, [dispatch, loaded, loading]);

  const activities = useMemo(() => schoolActivities.slice().sort((firstActivity, secondActivity) => {
    const firstActivityTimestamp = new Date(firstActivity.createdAt).getTime();
    const secondActivityTimestamp = new Date(secondActivity.createdAt).getTime();
    const dateDifference = (Number.isNaN(secondActivityTimestamp) ? Number.NEGATIVE_INFINITY : secondActivityTimestamp)
      - (Number.isNaN(firstActivityTimestamp) ? Number.NEGATIVE_INFINITY : firstActivityTimestamp);

    return dateDifference || String(firstActivity.id ?? firstActivity.ActivityId ?? '').localeCompare(
      String(secondActivity.id ?? secondActivity.ActivityId ?? '')
    );
  }), [schoolActivities]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat aktivitas..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchSchoolActivities())} /></main>;

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
          {activities.map((activity) => (
              <li key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
                <h2>{activity.name}</h2><time>Dipublikasikan {formatActivityPublicationDate(activity.createdAt)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
