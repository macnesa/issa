import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchoolActivities } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { PageContainer, PageHeader, Surface } from '../shared/ui/ui';

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
    const firstTimestamp = new Date(firstActivity.createdAt).getTime();
    const secondTimestamp = new Date(secondActivity.createdAt).getTime();
    const dateDifference = (Number.isNaN(secondTimestamp) ? Number.NEGATIVE_INFINITY : secondTimestamp)
      - (Number.isNaN(firstTimestamp) ? Number.NEGATIVE_INFINITY : firstTimestamp);
    return dateDifference || String(firstActivity.id ?? firstActivity.ActivityId ?? '').localeCompare(
      String(secondActivity.id ?? secondActivity.ActivityId ?? '')
    );
  }), [schoolActivities]);

  if (loading) return <PageContainer><LoadingState label="Memuat aktivitas..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={() => dispatch(fetchSchoolActivities())} /></PageContainer>;

  return (
    <PageContainer className="page-grid activities-page">
      <PageHeader title="Aktivitas" description="Publikasi aktivitas terbaru dari kelas." />
      {!activities.length ? (
        <EmptyState message="Belum ada aktivitas yang tersedia." />
      ) : (
        <Surface className="activities-ledger">
          <ol className="activity-list">
            {activities.map((activity) => (
              <li key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
                <span className="activity-list__marker" aria-hidden="true" />
                <div>
                  <h2>{activity.name}</h2>
                  <time>Dipublikasikan {formatActivityPublicationDate(activity.createdAt)}</time>
                </div>
              </li>
            ))}
          </ol>
        </Surface>
      )}
    </PageContainer>
  );
}
