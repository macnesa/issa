import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import {
  LessonRow,
  PageContainer,
  PageHeader,
  SectionHeader,
  Surface,
} from '../shared/ui/ui';
import { buildProgressOverview } from '../features/progress/helpers';

function formatScoreValue(scoreValue) {
  return scoreValue === null
    ? '-'
    : scoreValue.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export default function TotalNilai() {
  const dispatch = useDispatch();
  const { studentDetail: scoreResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = scoreResource;
  const progressOverview = useMemo(
    () => buildProgressOverview(studentDetail.scores),
    [studentDetail.scores],
  );

  if (loading) return <PageContainer><LoadingState label="Memuat perkembangan akademik..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></PageContainer>;

  return (
    <PageContainer className="page-grid page-grid--split">
      <PageHeader
        title="Perkembangan Akademik"
        description="Ringkasan nilai berdasarkan mata pelajaran."
        wide
      />

      {!progressOverview.assessmentCount ? (
        <div className="surface--full">
          <EmptyState message="Belum ada nilai yang tercatat." />
        </div>
      ) : (
        <>
          <Surface className="progress-summary" aqua>
            <SectionHeader kicker="Ringkasan" title="Capaian tercatat" />
            <dl className="metric-grid progress-summary__metrics">
              <div className="metric-card">
                <dt className="metric-label">Rata-rata keseluruhan</dt>
                <dd className="metric-value">{formatScoreValue(progressOverview.overallAverage)}</dd>
              </div>
              <div className="metric-card">
                <dt className="metric-label">Mata pelajaran</dt>
                <dd className="metric-value">{progressOverview.lessonCount}</dd>
              </div>
            </dl>
          </Surface>

          <Surface>
            <SectionHeader kicker="Catatan akademik" title="Daftar Mata Pelajaran" />
            <ul className="lesson-list">
              {progressOverview.lessons.map((lesson) => (
                <li key={lesson.id ?? lesson.name}>
                  <LessonRow
                    to={`/progress/${lesson.id}`}
                    title={lesson.name}
                    meta={`${lesson.assessmentCount} assessment · KKM ${lesson.kkm ?? '-'}`}
                    value={formatScoreValue(lesson.average)}
                  />
                </li>
              ))}
            </ul>
          </Surface>
        </>
      )}

      {loaded && !progressOverview.assessmentCount && <span className="sr-only">Score data is empty.</span>}
    </PageContainer>
  );
}
