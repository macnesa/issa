import { Link } from 'react-router-dom';
import { SectionHeader, Surface } from '../../../shared/ui/ui';

function formatAverageScore(scoreValue) {
  const numericValue = Number(scoreValue);
  return Number.isFinite(numericValue)
    ? numericValue.toLocaleString('id-ID', { maximumFractionDigits: 1 })
    : '-';
}

export default function AcademicSummary({ summary }) {
  return (
    <Surface className="academic-summary">
      <SectionHeader
        kicker="Catatan akademik"
        title="Perkembangan Akademik"
        action={<Link to="/progress" className="text-link">Lihat perkembangan</Link>}
      />
      {!summary.lessonCount ? (
        <p className="page-supporting-text academic-summary__empty">
          Belum ada nilai yang tercatat.
        </p>
      ) : (
        <>
          <dl className="metric-grid academic-summary__metrics">
            <div className="metric-card">
              <dt className="metric-label">Rata-rata keseluruhan</dt>
              <dd className="metric-value">{formatAverageScore(summary.overallAverage)}</dd>
            </div>
            <div className="metric-card">
              <dt className="metric-label">Mata pelajaran bernilai</dt>
              <dd className="metric-value">{summary.lessonCount}</dd>
            </div>
          </dl>
          <ul className="record-list">
            {summary.preview.map((lesson) => (
              <li key={lesson.id ?? lesson.name} className="history-record">
                <strong className="history-record__title">{lesson.name}</strong>
                <span className="history-record__meta">
                  {formatAverageScore(lesson.average)} · {lesson.assessmentCount} assessment
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Surface>
  );
}
