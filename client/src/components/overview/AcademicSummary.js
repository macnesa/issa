import { Link } from 'react-router-dom';

function formatAverage(value) {
  return value === null ? '-' : value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

export default function AcademicSummary({ summary }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-heading">Perkembangan Akademik</h2>
        <Link to="/progress" className="text-link">Lihat perkembangan</Link>
      </div>

      {!summary.lessonCount ? (
        <p className="mt-3 text-sm text-[var(--issa-text-secondary)]">Belum ada nilai yang tercatat.</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="metric-card">
              <dt className="metric-label">Rata-rata keseluruhan</dt>
              <dd className="metric-value">{formatAverage(summary.overallAverage)}</dd>
            </div>
            <div className="metric-card">
              <dt className="metric-label">Mata pelajaran bernilai</dt>
              <dd className="metric-value">{summary.lessonCount}</dd>
            </div>
          </dl>
          <ul className="mt-4 divide-y divide-[var(--issa-border)]">
            {summary.preview.map((lesson) => (
              <li key={lesson.id ?? lesson.name} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-[var(--issa-text)]">{lesson.name}</span>
                <span className="text-[var(--issa-text-secondary)]">{formatAverage(lesson.average)} · {lesson.assessmentCount} assessment</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
