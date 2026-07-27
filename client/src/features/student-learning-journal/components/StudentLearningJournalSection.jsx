import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import EvidenceViewer from '../../student-evidence/components/EvidenceViewer';
import { fetchStudentLearningJournal } from '../studentLearningJournalApi';
import JournalEntry from './JournalEntry';
const studentLearningJournalStyles = String.raw`
.parent-journal {
  position: relative;
  overflow: hidden;
  border: 1px solid #c8c2aa;
  border-radius: 0.9rem 0.9rem 2.2rem 0.9rem;
  background: #fffdf7;
  box-shadow: 0.46rem 0.5rem 0 rgba(105, 92, 57, 0.08);
}

.parent-journal__section-header {
  padding: 1.2rem 1.35rem 1.05rem;
  border-bottom: 1px solid #ddd5bd;
  background:
    linear-gradient(90deg, rgba(130, 113, 65, 0.055) 1px, transparent 1px),
    linear-gradient(108deg, #f4eedc, #fffdf7 72%);
  background-size: 2.7rem 100%, 100% 100%;
}

.parent-journal__section-header h2 {
  margin: 0.24rem 0 0;
  color: var(--issa-text);
  font-size: 1.28rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.parent-journal__section-header > span {
  display: block;
  max-width: 42rem;
  margin-top: 0.35rem;
  color: var(--issa-text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
}

.parent-journal__timeline {
  margin: 0;
  padding: 0 1.25rem;
  list-style: none;
}

.parent-journal__message {
  display: grid;
  min-height: 7rem;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.25rem;
}

.parent-journal__message--error {
  border-left: 0.28rem solid #b17863;
  background: #fffaf7;
}

.parent-journal__message > span {
  color: #8d856f;
  font-size: 0.74rem;
  font-weight: 850;
}

.parent-journal__message strong {
  color: var(--issa-text);
  font-size: 0.88rem;
}

.parent-journal__message p {
  margin: 0.25rem 0 0;
  color: var(--issa-text-secondary);
  font-size: 0.76rem;
}

.parent-journal__message button {
  min-height: 2.45rem;
  border-radius: 0.58rem;
  background: var(--issa-primary);
  padding: 0.48rem 0.78rem;
  color: white;
  font-size: 0.76rem;
  font-weight: 750;
}

.parent-journal__skeleton {
  display: grid;
  padding: 0 1.25rem;
}

.parent-journal__skeleton > div {
  display: grid;
  min-height: 7.4rem;
  grid-template-columns: 2rem 0.85rem minmax(0, 1fr);
  align-items: center;
  gap: 0.72rem;
}

.parent-journal__skeleton > div + div {
  border-top: 1px solid #e1dac7;
}

.parent-journal__skeleton span {
  height: 0.65rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #eee8d9, #fffdf7, #eee8d9);
  background-size: 220% 100%;
  animation: parent-journal-shimmer 1.15s linear infinite;
}

.parent-journal__skeleton span:nth-child(2) {
  width: 0.78rem;
  height: 0.78rem;
}

.parent-journal__skeleton span:nth-child(3) {
  width: 72%;
  height: 2.5rem;
}

@keyframes parent-journal-shimmer {
  to { background-position: -220% 0; }
}

@media (min-width: 900px) {
  .parent-journal {
    grid-column: 1 / -1;
  }
}

@media (max-width: 559px) {
  .parent-journal__timeline,
  .parent-journal__skeleton {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .parent-journal__message {
    grid-template-columns: 1.5rem minmax(0, 1fr);
  }

  .parent-journal__message button {
    grid-column: 2;
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .parent-journal__skeleton span {
    animation: none;
  }
}
`;

function JournalStateMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`parent-journal__message parent-journal__message--${tone}`}>
      <span aria-hidden="true">—</span>
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

function JournalSkeleton() {
  return (
    <div
      className="parent-journal__skeleton"
      role="status"
      aria-live="polite"
      aria-label="Memuat jurnal belajar"
    >
      {[0, 1, 2].map((rowIndex) => (
        <div key={rowIndex}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export default function StudentLearningJournalSection({
  studentId,
  refreshKey = 0,
}) {
  const [resource, setResource] = useState({
    status: studentId ? 'loading' : 'success',
    data: [],
    error: null,
  });
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const requestSequence = useRef(0);
  const sectionHeadingRef = useRef(null);

  const focusSectionHeading = useCallback(() => {
    window.requestAnimationFrame(() => {
      sectionHeadingRef.current?.focus();
    });
  }, []);

  const loadJournal = useCallback(async ({ signal } = {}) => {
    if (!studentId) {
      setResource({ status: 'success', data: [], error: null });
      return;
    }

    const requestId = ++requestSequence.current;
    setResource((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    try {
      const journalEntries = await fetchStudentLearningJournal(
        studentId,
        { signal }
      );
      if (signal?.aborted || requestId !== requestSequence.current) return;
      const visibleEntries = journalEntries.slice(0, 6);
      setResource({
        status: 'success',
        data: visibleEntries,
        error: null,
      });
      setSelectedEvidence((currentEvidence) => {
        if (!currentEvidence) return null;

        const refreshedEvidence = journalEntries
          .map((entry) => entry.evidence)
          .find((evidence) => (
            evidence
            && evidence.availability !== 'retracted'
            && evidence.file?.url
            && String(evidence.id) === String(currentEvidence.id)
          ));
        if (refreshedEvidence) return refreshedEvidence;

        focusSectionHeading();
        return null;
      });
    } catch (apiError) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({
        status: 'error',
        data: [],
        error: normalizeApiError(apiError),
      });
    }
  }, [focusSectionHeading, studentId]);

  useEffect(() => {
    const requestController = new AbortController();
    loadJournal({ signal: requestController.signal });
    return () => {
      requestController.abort();
      requestSequence.current += 1;
    };
  }, [loadJournal, refreshKey, retryKey]);

  useEffect(() => {
    setSelectedEvidence(null);
  }, [studentId]);

  return (
    <>
      <style>{studentLearningJournalStyles}</style>
      <section
        className="parent-journal"
        aria-labelledby="parent-journal-title"
        aria-busy={resource.status === 'loading'}
      >
        <header className="parent-journal__section-header">
          <p className="overview-kicker">Jurnal belajar</p>
          <h2
            id="parent-journal-title"
            ref={sectionHeadingRef}
            tabIndex="-1"
          >
            Perjalanan belajar terbaru
          </h2>
          <span>
            Catatan yang dibagikan guru mengenai proses, refleksi, dan
            perkembangan belajar.
          </span>
        </header>

        {resource.status === 'loading' && <JournalSkeleton />}
        {resource.status === 'error' && (
          <JournalStateMessage
            tone="error"
            title="Jurnal belajar belum dapat dimuat."
            description={resource.error?.message || 'Silakan coba beberapa saat lagi.'}
            onRetry={() => setRetryKey((current) => current + 1)}
          />
        )}
        {resource.status === 'success' && resource.data.length === 0 && (
          <JournalStateMessage
            tone="empty"
            title="Belum ada catatan perjalanan belajar yang dibagikan."
          />
        )}
        {resource.status === 'success' && resource.data.length > 0 && (
          <ol className="parent-journal__timeline">
            {resource.data.map((entry, index) => (
              <JournalEntry
                key={entry.id}
                entry={entry}
                index={index}
                onOpenEvidence={setSelectedEvidence}
              />
            ))}
          </ol>
        )}
      </section>

      <EvidenceViewer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </>
  );
}
