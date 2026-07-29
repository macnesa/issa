import { Link } from 'react-router-dom';

function formatAverageScore(scoreValue) {
  const numericValue = Number(scoreValue);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-';
}

export default function AcademicSummary({ summary }) {
  const score = Math.max(0, Math.min(100, Number(summary.overallAverage) || 0));

  return (
    <section className="relative overflow-hidden rounded-[0.85rem_2.6rem_0.85rem_0.85rem] border border-[#e0d9ff] bg-[#f5f2ff] p-[1.35rem] max-[399px]:p-[1.15rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Catatan akademik</p><h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)]">Perkembangan Akademik</h2></div>
        <Link to="/progress" className="text-link">Lihat perkembangan</Link>
      </div>

      {!summary.lessonCount ? (
        <p className="mt-3 text-sm text-[var(--issa-text-secondary)]">Belum ada nilai yang tercatat.</p>
      ) : (
        <>
          <div className="relative z-[1] mt-4 flex items-center gap-[1.1rem] max-[399px]:gap-[0.8rem] min-[900px]:min-h-[7.2rem] min-[900px]:gap-6">
            <div
              className="relative flex h-[5.55rem] w-[5.55rem] shrink-0 items-center justify-center sm:h-[6.5rem] sm:w-[6.5rem]"
              style={{
                background: `conic-gradient(#9555c2 ${score}%, #e3d8f0 0)`,
                borderRadius: '49% 51% 58% 42% / 41% 44% 56% 59%',
                boxShadow: '0.38rem 0.43rem 0 rgba(149, 85, 194, 0.14), 0 0 0 0.2rem rgba(149, 85, 194, 0.08)',
                transform: 'rotate(-5deg)',
              }}
              aria-label={`Rata-rata keseluruhan ${formatAverageScore(summary.overallAverage)}`}
            >
              <span className="absolute h-[4.4rem] w-[4.4rem] rounded-[inherit] bg-[#f5f2ff] sm:h-[5.15rem] sm:w-[5.15rem]" aria-hidden="true" />
              <span className="relative z-[1] text-[1.12rem] font-extrabold text-[#684087] sm:text-[1.28rem]">{formatAverageScore(summary.overallAverage)}</span>
              <small className="absolute z-[1] mt-[2.2rem] text-[0.6rem] font-bold text-[#806694] sm:mt-[2.55rem] sm:text-[0.65rem]">rata-rata</small>
            </div>
            <dl className="m-0 grid gap-[0.7rem]">
              <div><dt className="text-[0.76rem] font-bold text-[#806694]">Rata-rata keseluruhan</dt><dd className="mt-[0.08rem] text-[1.22rem] font-extrabold text-[#4d315e] min-[900px]:text-[1.32rem]">{formatAverageScore(summary.overallAverage)}</dd></div>
              <div><dt className="text-[0.76rem] font-bold text-[#806694]">Mata pelajaran bernilai</dt><dd className="mt-[0.08rem] text-[1.22rem] font-extrabold text-[#4d315e] min-[900px]:text-[1.32rem]">{summary.lessonCount}</dd></div>
            </dl>
          </div>
          <ul className="relative z-[1] mt-[1.15rem] grid list-none gap-[0.45rem] p-0 min-[900px]:gap-[0.38rem]">
            {summary.preview.map((lesson) => (
              <li key={lesson.id ?? lesson.name} className="flex items-center justify-between gap-4 rounded-[0.65rem] bg-white/65 px-[0.8rem] py-[0.72rem] text-[0.84rem] text-[#4d315e] max-[399px]:gap-[0.55rem] min-[900px]:min-h-[2.7rem] min-[900px]:bg-white/60 min-[900px]:px-[0.75rem] min-[900px]:py-[0.6rem]">
                <span className="font-bold">{lesson.name}</span>
                <span className="text-right text-[0.78rem] text-[#806694]">{formatAverageScore(lesson.average)} · {lesson.assessmentCount} assessment</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
