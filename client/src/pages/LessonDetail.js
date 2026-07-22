import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import LineChart from '../components/LineChart';
import AssessmentHistory from '../components/progress/AssessmentHistory';
import { fetchStudentDetail } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../components/runtime/ResourceStates';
import { getLessonProgress } from '../utils/academicProgress';

function formatValue(value) {
  return value === null || value === undefined ? '-' : value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const dispatch = useDispatch();
  const { studentDetail: scoreResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = scoreResource;
  const lesson = useMemo(() => getLessonProgress(studentDetail.scores, lessonId), [studentDetail.scores, lessonId]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat nilai..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentDetail())} /></main>;

  if (!lesson || !lesson.assessmentCount) {
    return (
      <main className="page-container">
        <Link to="/progress" className="text-link inline-block">Kembali ke Perkembangan</Link>
        <EmptyState message="Belum ada nilai untuk mata pelajaran ini." />
      </main>
    );
  }

  return (
    <main className="page-container lesson-detail-page">
      <section className="lesson-detail-page__heading">
        <Link to="/progress" className="text-link inline-block">Kembali ke Perkembangan</Link>
        <h1 className="page-title mt-4">{lesson.name}</h1>
        <p className="page-supporting-text mt-1">KKM: {lesson.kkm ?? '-'}</p>
      </section>

      <section className="lesson-detail-page__metrics">
        {[
          ['Rata-rata', formatValue(lesson.average)],
          ['Assessment', lesson.assessmentCount],
          ['Tertinggi', formatValue(lesson.max)],
          ['Terendah', formatValue(lesson.min)],
        ].map(([label, value]) => (
          <div key={label}>
            <p>{label}</p><strong>{value}</strong>
          </div>
        ))}
      </section>

      <AssessmentHistory records={lesson.records} />

      <section className="lesson-detail-page__chart">
        <p className="overview-kicker">Visual pendukung</p><h2>Visual Nilai</h2>
        <p>Visual pendukung histori assessment.</p>
        <div>
          <LineChart data={lesson.records} />
        </div>
      </section>

      {loaded && !lesson.records.length && <span className="sr-only">Lesson score data is empty.</span>}
    </main>
  );
}
