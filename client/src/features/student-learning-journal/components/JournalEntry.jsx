import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../../student-evidence/studentEvidence.constants';
import {
  formatJournalObservedDate,
  journalEntryTypes,
  journalVoiceCaptureTypes,
} from '../studentLearningJournal.constants';
import './JournalEntry.css';

export default function JournalEntry({ entry, index, onOpenEvidence }) {
  const type = journalEntryTypes[entry.type] || {
    label: 'Catatan belajar',
    tone: 'default',
  };
  const captureType = entry.type === 'student_reflection'
    ? journalVoiceCaptureTypes[entry.voiceCaptureType]
    : null;
  const isDirectQuote = captureType?.presentation === 'quote';

  return (
    <li
      className={`parent-journal-entry parent-journal-entry--${type.tone}`}
      data-reflection-source={captureType?.presentation || undefined}
    >
      <span className="parent-journal-entry__index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="parent-journal-entry__marker" aria-hidden="true" />
      <article>
        <header className="parent-journal-entry__header">
          <div className="parent-journal-entry__labels">
            <span>{type.label}</span>
            {captureType && <span>· {captureType.label}</span>}
            {entry.wasEdited && (
              <span className="parent-journal-entry__edited">Diedit</span>
            )}
          </div>
          <time dateTime={entry.observedAt}>
            {formatJournalObservedDate(entry.observedAt)}
          </time>
        </header>

        {isDirectQuote ? (
          <blockquote className="parent-journal-entry__content">
            {entry.content}
          </blockquote>
        ) : (
          <p className="parent-journal-entry__content">{entry.content}</p>
        )}

        <p className="parent-journal-entry__teacher">
          Dicatat oleh {entry.teacher?.name || 'Guru'}
        </p>

        {entry.evidence && (
          <div className="parent-journal-entry__evidence">
            <button
              type="button"
              onClick={() => onOpenEvidence(entry.evidence)}
              aria-label={`Buka evidence ${entry.evidence.title}`}
            >
              <img
                src={entry.evidence.file?.url}
                alt={entry.evidence.title}
              />
            </button>
            <div>
              <span>Evidence terkait</span>
              <strong>{entry.evidence.title}</strong>
              <small>
                {evidenceCategoryLabels[entry.evidence.category]
                  || entry.evidence.category
                  || 'Kategori tidak tersedia'}
                {' · '}
                {formatEvidenceObservedDate(entry.evidence.observedAt)}
              </small>
            </div>
          </div>
        )}
      </article>
    </li>
  );
}
