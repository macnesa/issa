import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import LineChart from '../features/progress/components/LineChart';
import AssessmentHistory from '../features/progress/components/AssessmentHistory';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { getLessonProgress } from '../features/progress/helpers';

function formatScoreValue(scoreValue) {
  return scoreValue === null || scoreValue === undefined ? '-' : scoreValue.toLocaleString('id-ID', { maximumFractionDigits: 1 });
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
  ) {
    return 'Perbandingan dengan KKM belum tersedia.';
  }
  if (Number(scoreValue) > Number(kkm)) {
    return 'Nilai yang tercatat berada di atas KKM.';
  }
  if (Number(scoreValue) === Number(kkm)) {
    return 'Nilai yang tercatat sama dengan KKM.';
  }
  return 'Nilai yang tercatat berada di bawah KKM.';
}

function chronologicalChartRecords(records) {
  return records
    .filter((scoreRecord) => (
      Number.isFinite(Number(scoreRecord.value))
      && Boolean(scoreRecord.recordedAt)
      && !Number.isNaN(new Date(scoreRecord.recordedAt).getTime())
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
  const lesson = useMemo(() => getLessonProgress(studentDetail.scores, lessonId), [studentDetail.scores, lessonId]);
  const chartRecords = useMemo(
    () => chronologicalChartRecords(lesson?.records || []),
    [lesson],
  );

  if (loading) return <main className="page-container"><LoadingState label="Memuat nilai..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

  const assessmentCount = lesson?.assessmentCount || 0;
  const isSingleAssessment = assessmentCount === 1;
  const hasTrendChart = assessmentCount >= 2 && chartRecords.length >= 2;
  const currentScore = lesson?.records[0]?.value;

  return (
    <main className="page-container grid items-start gap-5 sm:gap-6 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="border-l-[0.35rem] border-[#9555c2] py-[0.4rem] pr-0 pb-[0.55rem] pl-4 min-[900px]:col-span-2">
        <Link to="/progress" className="text-link inline-block">Kembali ke Perkembangan</Link>
        <h1 className="page-title mt-4 text-[clamp(1.8rem,6vw,2.5rem)]">{lesson?.name || 'Detail Mata Pelajaran'}</h1>
        <p className="page-supporting-text mt-1">KKM: {lesson?.kkm ?? '-'}</p>
      </section>

      {!assessmentCount && (
        <section className="min-[900px]:col-span-2">
          <EmptyState message="Belum ada assessment yang tercatat untuk mata pelajaran ini." />
        </section>
      )}

      {isSingleAssessment && (
        <section className="min-[900px]:col-span-2 grid min-w-0 gap-4 border border-[#d8cfea] border-l-[0.35rem] border-l-[#9555c2] bg-[#faf8ff] p-4 sm:grid-cols-[minmax(8rem,0.55fr)_minmax(0,1.45fr)] sm:items-center">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.11em] text-[#806694]">Nilai tercatat</p>
            <strong className="mt-1 block text-[clamp(2rem,8vw,3rem)] font-extrabold leading-none text-[#4d315e]">
              {formatScoreValue(currentScore)}
            </strong>
          </div>
          <div className="min-w-0 border-t border-[#ddd5e8] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[0.7rem] font-bold text-[#806694]">Assessment</dt>
                <dd className="mt-1 text-sm font-extrabold text-[#4d315e]">1 tercatat</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] font-bold text-[#806694]">KKM</dt>
                <dd className="mt-1 text-sm font-extrabold text-[#4d315e]">{formatScoreValue(lesson.kkm)}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-[#e4deeb] pt-3 text-[0.82rem] leading-[1.5] text-[#655675]">
              {describeScoreAgainstKkm(currentScore, lesson.kkm)}
            </p>
          </div>
        </section>
      )}

      {assessmentCount >= 2 && (
        <section className="grid grid-cols-2 gap-[0.7rem] sm:grid-cols-4 min-[900px]:col-span-2">
          {[
            ['Rata-rata', formatScoreValue(lesson.average)],
            ['Assessment', lesson.assessmentCount],
            ['Tertinggi', formatScoreValue(lesson.max)],
            ['Terendah', formatScoreValue(lesson.min)],
          ].map(([label, value]) => (
            <div className="rounded-[0.8rem_0.4rem_0.8rem_0.4rem] border border-[#e0d9ff] bg-[#f8f5ff] p-[0.85rem]" key={label}>
              <p className="m-0 text-[0.76rem] font-bold text-[#806694]">{label}</p><strong className="mt-[0.2rem] block text-[1.35rem] [font-weight:850] text-[#4d315e]">{value}</strong>
            </div>
          ))}
        </section>
      )}

      {assessmentCount > 0 && (
        <AssessmentHistory
          records={lesson.records}
          className={hasTrendChart ? '' : 'min-[900px]:col-span-2'}
        />
      )}

      {hasTrendChart && (
        <section className="self-start overflow-hidden rounded-[0.85rem] border border-[#e0d9ff] bg-[#f8f5ff] p-[1.35rem]">
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Visual pendukung</p>
          <h2 className="mt-1 text-[1.2rem] [font-weight:850]">Visual Nilai</h2>
          <p className="mt-[0.35rem] text-[0.88rem] text-[#806694]">Urutan visual mengikuti tanggal pencatatan assessment.</p>
          <div className="mt-4 min-w-0">
            <LineChart data={chartRecords} />
          </div>
        </section>
      )}
    </main>
  );
}
