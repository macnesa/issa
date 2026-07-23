import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { buildProgressOverview } from '../features/progress/helpers';

function formatScoreValue(scoreValue) {
  return scoreValue === null ? '-' : scoreValue.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export default function TotalNilai() {
  const dispatch = useDispatch();
  const { studentDetail: scoreResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = scoreResource;
  const progressOverview = useMemo(() => buildProgressOverview(studentDetail.scores), [studentDetail.scores]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat perkembangan akademik..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

  return (
    <main className="page-container progress-page">
      <section className="editorial-page-heading progress-page__heading">
        <h1 className="page-title">Perkembangan Akademik</h1>
        <p className="page-supporting-text mt-1">Ringkasan nilai berdasarkan mata pelajaran.</p>
      </section>

      {!progressOverview.assessmentCount ? (
        <EmptyState message="Belum ada nilai yang tercatat." />
      ) : (
        <>
          <section className="progress-page__summary">
            <div className="progress-page__metric">
              <p>Rata-rata keseluruhan</p><strong>{formatScoreValue(progressOverview.overallAverage)}</strong>
            </div>
            <div className="progress-page__metric">
              <p>Mata pelajaran</p><strong>{progressOverview.lessonCount}</strong>
            </div>
          </section>

          <section className="progress-page__lessons">
            <p className="overview-kicker">Academic record</p><h2>Daftar Mata Pelajaran</h2>
            <ul>
              {progressOverview.lessons.map((lesson) => (
                <li key={lesson.id ?? lesson.name}>
                  <Link to={`/progress/${lesson.id}`}>
                    <div>
                      <p>{lesson.name}</p><p>{lesson.assessmentCount} assessment · KKM {lesson.kkm ?? '-'}</p>
                    </div>
                    <span className="text-right">
                      <span>{formatScoreValue(lesson.average)}</span>
                      <span className="text-link text-xs">Detail</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {loaded && !progressOverview.assessmentCount && <span className="sr-only">Score data is empty.</span>}
    </main>
  );
}
