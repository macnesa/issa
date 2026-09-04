import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { getLessonProgress } from '../features/progress/helpers';
import { formatParentDate } from '../features/parent-journey/parentJourney';

export default function LessonDetail() {
  const { lessonId } = useParams();
  const dispatch = useDispatch();
  const resource = useSelector((state) => state.student.studentDetail);
  const { data: studentDetail, loading, error } = resource;
  const lesson = useMemo(() => getLessonProgress(studentDetail.scores, lessonId), [lessonId, studentDetail.scores]);

  if (loading) return <main id="parent-main-content" tabIndex={-1} className="page-container"><LoadingState label="Memuat penilaian..." /></main>;
  if (error) return <main id="parent-main-content" tabIndex={-1} className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

  return (
    <main id="parent-main-content" tabIndex={-1} className="page-container parent-new-page parent-lesson-detail">
      <StudentIdentity profile={studentDetail.profile} compact />
      <header className="parent-new-heading">
        <span>Penilaian</span>
        <h1>{lesson?.name || 'Mata pelajaran'}</h1>
        <p>{lesson?.kkm !== null && lesson?.kkm !== undefined
          ? `Batas ketuntasan yang ditetapkan sekolah (KKM): ${lesson.kkm}.`
          : 'Batas ketuntasan dari sekolah belum tersedia.'}</p>
        <Link className="parent-inline-link" to="/progress">Semua mata pelajaran</Link>
      </header>

      {!lesson?.records?.length ? (
        <EmptyState message={lesson ? 'Belum ada penilaian yang tercatat untuk mata pelajaran ini.' : 'Mata pelajaran ini belum ditemukan dalam catatan anak Anda.'} />
      ) : (
        <ol className="parent-assessment-history">
          {lesson.records.map((record) => (
            <li key={record.id ?? `${record.assignmentId}-${record.recordedAt}`}>
              <div>
                <span>{formatParentDate(record.recordedAt)}</span>
                <h2>{record.assignment?.description || 'Penilaian tanpa keterangan'}</h2>
                <p>{record.category || 'Kategori belum tersedia'}</p>
              </div>
              <strong>{record.value ?? '—'}</strong>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
