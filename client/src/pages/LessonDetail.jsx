import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import LineChart from '../features/progress/components/LineChart';
import AssessmentHistory from '../features/progress/components/AssessmentHistory';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { PageContainer, PageHeader, SectionHeader, Surface } from '../shared/ui/ui';
import { getLessonProgress } from '../features/progress/helpers';

function formatScoreValue(scoreValue) {
  return scoreValue === null || scoreValue === undefined
    ? '-'
    : scoreValue.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function describeScoreAgainstKkm(scoreValue, kkm) {
  if (
    scoreValue === null
    || scoreValue === undefined
    || scoreValue === ''
    || kkm === null
    || kkm === undefined
    || kkm === ''
    || !Number.isFinite(Number(scoreValue))
    || !Number.isFinite(Number(kkm))
  ) return 'Perbandingan dengan KKM belum tersedia.';
  if (Number(scoreValue) > Number(kkm)) return 'Nilai yang tercatat berada di atas KKM.';
  if (Number(scoreValue) === Number(kkm)) return 'Nilai yang tercatat sama dengan KKM.';
  return 'Nilai yang tercatat berada di bawah KKM.';
}

function chronologicalChartRecords(records) {
  return records
    .filter((record) => (
      Number.isFinite(Number(record.value))
      && Boolean(record.recordedAt)
      && !Number.isNaN(new Date(record.recordedAt).getTime())
    ))
    .slice()
    .sort((leftRecord, rightRecord) => (
      new Date(leftRecord.recordedAt).getTime()
      - new Date(rightRecord.recordedAt).getTime()
      || String(leftRecord.id ?? '').localeCompare(String(rightRecord.id ?? ''), 'id')
    ));
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const dispatch = useDispatch();
  const { studentDetail: scoreResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, error } = scoreResource;
  const lesson = useMemo(
    () => getLessonProgress(studentDetail.scores, lessonId),
    [studentDetail.scores, lessonId],
  );
  const chartRecords = useMemo(
    () => chronologicalChartRecords(lesson?.records || []),
    [lesson],
  );

  if (loading) return <PageContainer><LoadingState label="Memuat nilai..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></PageContainer>;

  const assessmentCount = lesson?.assessmentCount || 0;
  const hasTrendChart = assessmentCount >= 2 && chartRecords.length >= 2;
  const currentScore = lesson?.records[0]?.value;

  return (
    <PageContainer className="page-grid page-grid--split lesson-detail">
      <PageHeader
        title={lesson?.name || 'Detail Mata Pelajaran'}
        description={`KKM: ${lesson?.kkm ?? '-'}`}
        wide
      >
        <Link to="/progress" className="text-link lesson-detail__back">
          Kembali ke Perkembangan
        </Link>
      </PageHeader>

      {!assessmentCount && (
        <div className="surface--full">
          <EmptyState message="Belum ada assessment yang tercatat untuk mata pelajaran ini." />
        </div>
      )}

      {assessmentCount > 0 && (
        <Surface className="surface--full assessment-summary" aqua>
          <SectionHeader kicker="Ringkasan penilaian" title="Capaian tercatat" />
          <dl className="metric-grid">
            <div className="metric-card">
              <dt className="metric-label">{assessmentCount === 1 ? 'Nilai tercatat' : 'Rata-rata'}</dt>
              <dd className="metric-value">
                {formatScoreValue(assessmentCount === 1 ? currentScore : lesson.average)}
              </dd>
            </div>
            <div className="metric-card">
              <dt className="metric-label">Assessment</dt>
              <dd className="metric-value">{assessmentCount}</dd>
            </div>
            <div className="metric-card">
              <dt className="metric-label">KKM</dt>
              <dd className="metric-value">{formatScoreValue(lesson.kkm)}</dd>
            </div>
            {assessmentCount >= 2 && (
              <div className="metric-card">
                <dt className="metric-label">Rentang</dt>
                <dd className="metric-value">
                  {formatScoreValue(lesson.min)}–{formatScoreValue(lesson.max)}
                </dd>
              </div>
            )}
          </dl>
          {assessmentCount === 1 && (
            <p className="assessment-summary__context">
              {describeScoreAgainstKkm(currentScore, lesson.kkm)}
            </p>
          )}
        </Surface>
      )}

      {assessmentCount > 0 && (
        <AssessmentHistory
          records={lesson.records}
          className={hasTrendChart ? '' : 'surface--full'}
        />
      )}

      {hasTrendChart && (
        <Surface className="lesson-chart">
          <SectionHeader
            kicker="Visual pendukung"
            title="Visual Nilai"
            description="Urutan visual mengikuti tanggal pencatatan assessment."
          />
          <LineChart data={chartRecords} />
        </Surface>
      )}
    </PageContainer>
  );
}
