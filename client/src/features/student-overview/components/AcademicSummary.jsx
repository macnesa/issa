import { Link } from 'react-router-dom';

function formatAverageScore(scoreValue) {
  const numericValue = Number(scoreValue);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-';
}

export default function AcademicSummary({ summary }) {
  const score = Math.max(0, Math.min(100, Number(summary.overallAverage) || 0));

  return (
    <section className="overview-academic-summary relative overflow-hidden p-[1.35rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="overview-kicker">Catatan akademik</p><h2>Perkembangan Akademik</h2></div>
        <Link to="/progress" className="text-link">Lihat perkembangan</Link>
      </div>

      {!summary.lessonCount ? (
        <p className="mt-3 text-sm text-[var(--issa-text-secondary)]">Belum ada nilai yang tercatat.</p>
      ) : (
        <>
          <div className="overview-academic-summary__main relative z-[1] mt-4 flex items-center gap-[1.1rem]">
            <div className="overview-academic-summary__orb" style={{ '--overview-score': `${score}%` }} aria-label={`Rata-rata keseluruhan ${formatAverageScore(summary.overallAverage)}`}>
              <span>{formatAverageScore(summary.overallAverage)}</span>
              <small>rata-rata</small>
            </div>
            <dl>
              <div><dt>Rata-rata keseluruhan</dt><dd>{formatAverageScore(summary.overallAverage)}</dd></div>
              <div><dt>Mata pelajaran bernilai</dt><dd>{summary.lessonCount}</dd></div>
            </dl>
          </div>
          <ul className="overview-academic-summary__lessons relative z-[1] mt-[1.15rem] grid list-none gap-[0.45rem] p-0">
            {summary.preview.map((lesson) => (
              <li key={lesson.id ?? lesson.name} className="flex items-center justify-between gap-4">
                <span>{lesson.name}</span>
                <span>{formatAverageScore(lesson.average)} · {lesson.assessmentCount} assessment</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
