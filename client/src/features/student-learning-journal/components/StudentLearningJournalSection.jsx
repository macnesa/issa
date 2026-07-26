import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import EvidenceViewer from '../../student-evidence/components/EvidenceViewer';
import { fetchStudentLearningJournal } from '../studentLearningJournalApi';
import JournalEntry from './JournalEntry';
import './StudentLearningJournalSection.css';

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
      setResource({
        status: 'success',
        data: journalEntries.slice(0, 6),
        error: null,
      });
    } catch (apiError) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({
        status: 'error',
        data: [],
        error: normalizeApiError(apiError),
      });
    }
  }, [studentId]);

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
      <section
        className="parent-journal"
        aria-labelledby="parent-journal-title"
        aria-busy={resource.status === 'loading'}
      >
        <header className="parent-journal__section-header">
          <p className="overview-kicker">Jurnal belajar</p>
          <h2 id="parent-journal-title">Perjalanan belajar terbaru</h2>
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
