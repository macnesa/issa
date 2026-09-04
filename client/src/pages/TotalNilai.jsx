import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { buildProgressOverview } from '../features/progress/helpers';
import { formatParentDate } from '../features/parent-journey/parentJourney';

export default function TotalNilai() {
  const dispatch = useDispatch();
  const resource = useSelector((state) => state.student.studentDetail);
  const { data: studentDetail, loading, error } = resource;
  const progress = useMemo(() => buildProgressOverview(studentDetail.scores), [studentDetail.scores]);

  if (loading) return <main id="parent-main-content" tabIndex={-1} className="page-container"><LoadingState label="Memuat penilaian..." /></main>;
  if (error) return <main id="parent-main-content" tabIndex={-1} className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

  return (
    <main id="parent-main-content" tabIndex={-1} className="page-container parent-new-page parent-assessment-index">
      <StudentIdentity profile={studentDetail.profile} compact />
      <header className="parent-new-heading">
        <span>Detail · Penilaian</span>
        <h1>Penilaian berdasarkan mata pelajaran.</h1>
        <p>Pilih mata pelajaran untuk melihat hasil belajar dan catatan penilaiannya.</p>
        <Link className="parent-inline-link" to="/journey">Kembali ke Perjalanan</Link>
      </header>

      {!progress.assessmentCount ? (
        <EmptyState message="Belum ada penilaian yang tercatat." />
      ) : (
        <section className="parent-assessment-subjects">
          {progress.lessons.map((lesson) => {
            const latest = lesson.records[0] || null;
            const content = (
              <>
                <span>{lesson.assessmentCount} penilaian</span>
                <h2>{lesson.name}</h2>
                {latest && (
                  <div>
                    <strong>{latest.value}</strong>
                    <p>{latest.assignment?.description || 'Penilaian terbaru'} · {formatParentDate(latest.recordedAt)}</p>
                  </div>
                )}
                <small>
                  Batas ketuntasan (KKM): {lesson.kkm ?? 'belum tersedia'}
                  {lesson.id !== null && lesson.id !== undefined ? ' · Lihat detail' : ''}
                </small>
              </>
            );

            return lesson.id !== null && lesson.id !== undefined ? (
              <Link key={lesson.id} to={`/progress/${lesson.id}`} className="parent-subject-card">
                {content}
              </Link>
            ) : (
              <article key={lesson.name} className="parent-subject-card">
                {content}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
