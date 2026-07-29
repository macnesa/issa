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
    <main className="page-container grid items-start gap-5 sm:gap-6 min-[900px]:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
      <section className="relative pt-2 pb-[0.55rem] min-[900px]:col-span-2">
        <h1 className="page-title text-[clamp(1.7rem,5vw,2.25rem)]">Perkembangan Akademik</h1>
        <p className="page-supporting-text mt-1">Ringkasan nilai berdasarkan mata pelajaran.</p>
      </section>

      {!progressOverview.assessmentCount ? (
        <EmptyState message="Belum ada nilai yang tercatat." />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-[0.8rem] self-start min-[900px]:grid-cols-1">
            <div className="rounded-[0.85rem_1.8rem_0.85rem_0.85rem] border border-[#e0d9ff] bg-[#f5f2ff] p-[1.15rem]">
              <p className="m-0 text-[0.8rem] font-bold text-[#806694]">Rata-rata keseluruhan</p><strong className="mt-1 block text-[clamp(1.65rem,6vw,2.2rem)] leading-none text-[#4d315e]">{formatScoreValue(progressOverview.overallAverage)}</strong>
            </div>
            <div className="rounded-[1.8rem_0.85rem_0.85rem] border border-[#e0d9ff] bg-[#ede6fb] p-[1.15rem]">
              <p className="m-0 text-[0.8rem] font-bold text-[#806694]">Mata pelajaran</p><strong className="mt-1 block text-[clamp(1.65rem,6vw,2.2rem)] leading-none text-[#4d315e]">{progressOverview.lessonCount}</strong>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[0.85rem_2.4rem_0.85rem_0.85rem] border border-[#e0d9ff] bg-[#faf8ff] p-[1.35rem]">
            <p className="relative z-[1] m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Academic record</p>
            <h2 className="relative z-[1] mt-1 text-[1.3rem] [font-weight:850]">Daftar Mata Pelajaran</h2>
            <ul className="relative z-[1] mt-4 grid list-none gap-[0.6rem] p-0">
              {progressOverview.lessons.map((lesson) => (
                <li key={lesson.id ?? lesson.name}>
                  <Link className="flex items-center justify-between gap-[0.8rem] rounded-[0.75rem_0.45rem_0.75rem_0.45rem] bg-white p-[0.85rem] text-inherit transition-[transform,box-shadow] duration-200 hover:-translate-x-[0.1rem] hover:-translate-y-[0.1rem] hover:shadow-[0.3rem_0.35rem_0_rgba(149,85,194,0.12)] motion-reduce:transform-none motion-reduce:transition-none" to={`/progress/${lesson.id}`}>
                    <div>
                      <p className="m-0 text-[0.94rem] font-extrabold text-[#4d315e]">{lesson.name}</p><p className="mt-1 text-[0.8rem] text-[#806694]">{lesson.assessmentCount} assessment · KKM {lesson.kkm ?? '-'}</p>
                    </div>
                    <span className="text-right">
                      <span className="block text-[1.2rem] [font-weight:850] text-[#4d315e]">{formatScoreValue(lesson.average)}</span>
                      <span className="text-link block text-xs !text-[#806694]">Detail</span>
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
