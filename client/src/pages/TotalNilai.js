import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentDetail } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../components/runtime/ResourceStates';
import { getProgressOverview } from '../utils/academicProgress';

function formatValue(value) {
  return value === null ? '-' : value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export default function TotalNilai() {
  const dispatch = useDispatch();
  const { studentDetail: scoreResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = scoreResource;
  const progress = useMemo(() => getProgressOverview(studentDetail.scores), [studentDetail.scores]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat perkembangan akademik..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentDetail())} /></main>;

  return (
    <main className="page-container space-y-4">
      <section>
        <h1 className="page-title">Perkembangan Akademik</h1>
        <p className="page-supporting-text mt-1">Ringkasan nilai berdasarkan mata pelajaran.</p>
      </section>

      {!progress.assessmentCount ? (
        <EmptyState message="Belum ada nilai yang tercatat." />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="metric-card p-5">
              <p className="metric-label">Rata-rata keseluruhan</p>
              <p className="mt-1 text-2xl font-bold text-[var(--issa-text)]">{formatValue(progress.overallAverage)}</p>
            </div>
            <div className="metric-card p-5">
              <p className="metric-label">Mata pelajaran</p>
              <p className="mt-1 text-2xl font-bold text-[var(--issa-text)]">{progress.lessonCount}</p>
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="section-heading">Daftar Mata Pelajaran</h2>
            <ul className="mt-3 divide-y divide-[var(--issa-border)]">
              {progress.lessons.map((lesson) => (
                <li key={lesson.id ?? lesson.name} className="py-3">
                  <Link to={`/progress/${lesson.id}`} className="flex items-center justify-between gap-4 rounded-[var(--issa-radius-sm)] p-1 hover:bg-[var(--issa-primary-soft)]">
                    <div>
                      <p className="font-semibold text-[var(--issa-text)]">{lesson.name}</p>
                      <p className="mt-1 text-sm text-[var(--issa-text-secondary)]">{lesson.assessmentCount} assessment · KKM {lesson.kkm ?? '-'}</p>
                    </div>
                    <span className="text-right">
                      <span className="block text-lg font-bold text-[var(--issa-text)]">{formatValue(lesson.average)}</span>
                      <span className="text-link text-xs">Detail</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {loaded && !progress.assessmentCount && <span className="sr-only">Score data is empty.</span>}
    </main>
  );
}
