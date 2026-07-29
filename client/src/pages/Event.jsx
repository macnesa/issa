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
    <main className="page-container grid items-start gap-5 sm:gap-6">
      <section className="relative pt-2 pb-[0.55rem]">
        <h1 className="page-title text-[clamp(1.7rem,5vw,2.25rem)]">Aktivitas</h1>
        <p className="page-supporting-text mt-1">Publikasi aktivitas terbaru dari kelas.</p>
      </section>

      {!activities.length ? (
        <EmptyState message="Belum ada aktivitas yang tersedia." />
      ) : (
        <section className="max-w-[52rem] rounded-[0.85rem_0.85rem_2.4rem_0.85rem] border border-[#eed8dd] bg-[#fff7f8] p-[1.35rem]">
          <ol className="m-0 grid list-none gap-4 border-l-2 border-[#f1cdd5] py-0 pl-[1.1rem]">
          {activities.map((activity) => (
              <li className="relative" key={activity.id ?? `${activity.name}-${activity.createdAt}`}>
                <span
                  className="absolute left-[-1.38rem] top-[0.4rem] h-2 w-2 rounded-full bg-[#d28a9a]"
                  style={{ boxShadow: '0 0 0 0.22rem #fdebed' }}
                  aria-hidden="true"
                />
                <h2 className="m-0 text-[0.96rem] [font-weight:850] text-[#573b45]">{activity.name}</h2><time className="mt-[0.3rem] block text-[0.82rem] font-semibold text-[#9a6b77]">Dipublikasikan {formatActivityPublicationDate(activity.createdAt)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
