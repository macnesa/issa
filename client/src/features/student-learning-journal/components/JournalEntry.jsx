import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../../student-evidence/studentEvidence.constants';
import {
  formatJournalObservedDate,
  journalEntryTypes,
  journalVoiceCaptureTypes,
} from '../studentLearningJournal.constants';

const journalToneClasses = {
  default: {
    marker: { backgroundColor: '#63827d', boxShadow: '0 0 0 1px #809993' },
    labelColor: '#426b65',
  },
  strength: {
    marker: { backgroundColor: '#69865c', boxShadow: '0 0 0 1px #8aa07f' },
    labelColor: '#426b65',
  },
  challenge: {
    marker: { backgroundColor: '#a18156', boxShadow: '0 0 0 1px #b9a17e' },
    labelColor: '#80643e',
  },
  milestone: {
    marker: { backgroundColor: '#46768b', boxShadow: '0 0 0 1px #7196a5' },
    labelColor: '#426b65',
  },
  reflection: {
    marker: { backgroundColor: '#766889', boxShadow: '0 0 0 1px #978da5' },
    labelColor: '#655978',
  },
};

export default function JournalEntry({ entry, index, onOpenEvidence }) {
  const type = journalEntryTypes[entry.type] || {
    label: 'Catatan belajar',
    tone: 'default',
  };
  const captureType = entry.type === 'student_reflection'
    ? journalVoiceCaptureTypes[entry.voiceCaptureType]
    : null;
  const isDirectQuote = captureType?.presentation === 'quote';
  const isEvidenceRetracted = entry.evidence?.availability === 'retracted';
  const isEvidenceAvailable = Boolean(
    entry.evidence
    && !isEvidenceRetracted
    && entry.evidence.file?.url
  );
  const toneClasses = journalToneClasses[type.tone] || journalToneClasses.default;

  return (
    <li
      className="parent-journal-entry relative grid grid-cols-[2rem_0.85rem_minmax(0,1fr)] items-start gap-[0.72rem] border-t border-[#e1dac7] py-[1.05rem] first:border-t-0 max-[559px]:grid-cols-[1.5rem_0.72rem_minmax(0,1fr)] max-[559px]:gap-[0.52rem]"
      data-reflection-source={captureType?.presentation || undefined}
    >
      <span className="pt-[0.17rem] text-[0.66rem] [font-weight:850] tracking-[0.08em] text-[#8c846f]" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="relative z-[1] mt-[0.17rem] h-[0.76rem] w-[0.76rem] rounded-full border-[0.16rem] border-[#fffdf7]" style={toneClasses.marker} aria-hidden="true" />
      <article className="min-w-0">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-[0.42rem] max-[559px]:grid">
          <div className="flex flex-wrap items-center gap-1 text-[0.66rem] [font-weight:850] uppercase tracking-[0.065em]" style={{ color: toneClasses.labelColor }}>
            <span>{type.label}</span>
            {captureType && <span>· {captureType.label}</span>}
            {entry.wasEdited && (
              <span className="ml-[0.3rem] rounded-full border border-[#c6b98f] px-[0.4rem] py-[0.11rem] normal-case tracking-[0.02em] text-[#71633b]">Diedit</span>
            )}
          </div>
          <time className="text-[0.7rem] text-[#807968]" dateTime={entry.observedAt}>
            {formatJournalObservedDate(entry.observedAt)}
          </time>
        </header>

        {isDirectQuote ? (
          <blockquote className="journal-direct-quote relative mt-[0.62rem] whitespace-pre-wrap break-words border-l-2 border-[#aaa0ba] pl-[0.86rem] font-serif text-[0.94rem] leading-[1.68] text-[#3e374c]">
            {entry.content}
          </blockquote>
        ) : (
          <p className="mt-[0.62rem] whitespace-pre-wrap break-words text-[0.86rem] leading-[1.68] text-[var(--issa-text)]">{entry.content}</p>
        )}

        <p className="mt-2 text-[0.72rem] text-[#70766f]">
          Dicatat oleh {entry.teacher?.name || 'Guru'}
        </p>

        {isEvidenceAvailable && (
          <div className="mt-[0.78rem] grid grid-cols-[5.2rem_minmax(0,1fr)] items-center gap-[0.72rem] rounded-[0.56rem] border border-[#d6ceba] bg-[#fbf7eb] p-[0.56rem] max-[559px]:grid-cols-[4.4rem_minmax(0,1fr)]">
            <button
              type="button"
              className="group h-[3.9rem] w-[5.2rem] cursor-zoom-in overflow-hidden rounded-[0.38rem] border border-[#c3bba8] bg-[#e9e2d2] p-0 max-[559px]:h-[3.5rem] max-[559px]:w-[4.4rem]"
              onClick={() => onOpenEvidence(entry.evidence)}
              aria-label={`Buka evidence ${entry.evidence.title}`}
            >
              <img
                className="block h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none"
                src={entry.evidence.file?.url}
                alt={entry.evidence.title}
              />
            </button>
            <div>
              <span className="block text-[0.59rem] [font-weight:850] uppercase tracking-[0.08em] text-[#806c3d]">Evidence terkait</span>
              <strong className="mt-[0.2rem] block text-[0.78rem] text-[var(--issa-text)]">{entry.evidence.title}</strong>
              <small className="mt-[0.18rem] block text-[0.67rem] text-[#77705f]">
                {evidenceCategoryLabels[entry.evidence.category]
                  || entry.evidence.category
                  || 'Kategori tidak tersedia'}
                {' · '}
                {formatEvidenceObservedDate(entry.evidence.observedAt)}
              </small>
            </div>
          </div>
        )}
        {isEvidenceRetracted && (
          <div
            className="mt-[0.78rem] block rounded-[0.56rem] border border-dashed border-[#d6ceba] bg-[#f4f0e6] p-[0.56rem]"
          >
            <div>
              <span className="block text-[0.7rem] leading-[1.5] text-[#665e4e]">Evidence terkait telah dicabut dan tidak lagi tersedia.</span>
              <strong className="mt-[0.2rem] block text-[0.78rem] text-[var(--issa-text)]">{entry.evidence.title}</strong>
              <small className="mt-[0.18rem] block text-[0.67rem] text-[#77705f]">
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
