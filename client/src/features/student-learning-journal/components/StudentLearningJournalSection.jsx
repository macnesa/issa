import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import EvidenceViewer from '../../student-evidence/components/EvidenceViewer';
import { fetchStudentLearningJournal } from '../studentLearningJournalApi';
import JournalEntry from './JournalEntry';

function JournalStateMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`grid min-h-28 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-[0.8rem] px-5 py-4 max-[559px]:grid-cols-[1.5rem_minmax(0,1fr)] ${tone === 'error' ? 'border-l-[0.28rem] border-[#b17863] bg-[#fffaf7]' : ''}`}>
      <span className="text-[0.74rem] [font-weight:850] text-[#8d856f]" aria-hidden="true">—</span>
      <div>
        <strong className="text-[0.88rem] text-[var(--issa-text)]">{title}</strong>
        {description && <p className="mt-1 text-[0.76rem] text-[var(--issa-text-secondary)]">{description}</p>}
      </div>
      {onRetry && (
        <button className="min-h-[2.45rem] rounded-[0.58rem] bg-[var(--issa-primary)] px-[0.78rem] py-[0.48rem] text-[0.76rem] font-bold text-white max-[559px]:col-start-2 max-[559px]:justify-self-start" type="button" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

function JournalSkeleton() {
  return (
    <div
      className="grid px-5 max-[559px]:px-4"
      role="status"
      aria-live="polite"
      aria-label="Memuat jurnal belajar"
    >
      {[0, 1, 2].map((rowIndex) => (
        <div className="grid min-h-[7.4rem] grid-cols-[2rem_0.85rem_minmax(0,1fr)] items-center gap-[0.72rem] border-t border-[#e1dac7] first:border-t-0" key={rowIndex}>
          <span className="h-[0.65rem] animate-pulse rounded-full bg-[#eee8d9] motion-reduce:animate-none" />
          <span className="h-[0.78rem] w-[0.78rem] animate-pulse rounded-full bg-[#eee8d9] motion-reduce:animate-none" />
          <span className="h-10 w-[72%] animate-pulse rounded-full bg-[#eee8d9] motion-reduce:animate-none" />
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
      <section
        className="relative overflow-hidden rounded-[0.9rem_0.9rem_2.2rem_0.9rem] border border-[#c8c2aa] bg-[#fffdf7] min-[900px]:col-span-2"
        style={{ boxShadow: '0.46rem 0.5rem 0 rgba(105, 92, 57, 0.08)' }}
        aria-labelledby="parent-journal-title"
        aria-busy={resource.status === 'loading'}
      >
        <header
          className="border-b border-[#ddd5bd] px-[1.35rem] pb-[1.05rem] pt-[1.2rem]"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(130, 113, 65, 0.055) 1px, transparent 1px), linear-gradient(108deg, #f4eedc, #fffdf7 72%)',
            backgroundSize: '2.7rem 100%, 100% 100%',
          }}
        >
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Jurnal belajar</p>
          <h2
            className="mt-[0.24rem] text-[1.28rem] [font-weight:850] tracking-[-0.025em] text-[var(--issa-text)]"
            id="parent-journal-title"
            ref={sectionHeadingRef}
            tabIndex="-1"
          >
            Perjalanan belajar terbaru
          </h2>
          <span className="mt-[0.35rem] block max-w-[42rem] text-[0.82rem] leading-[1.5] text-[var(--issa-text-secondary)]">
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
          <ol className="m-0 list-none px-5 max-[559px]:px-4">
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
