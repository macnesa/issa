import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../studentEvidence.constants';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import EvidenceViewer from './EvidenceViewer';

function EvidenceStateMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`grid min-h-28 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-[0.8rem] px-5 py-4 max-[559px]:grid-cols-[1.5rem_minmax(0,1fr)] ${tone === 'error' ? 'border-l-[0.28rem] border-[var(--issa-danger)] bg-[#fffafa]' : ''}`}>
      <span className="text-[0.74rem] [font-weight:850] text-[#7b9095]" aria-hidden="true">—</span>
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

function EvidenceSkeleton() {
  return (
    <div className="grid px-5" aria-label="Memuat bukti perkembangan">
      {[0, 1].map((rowIndex) => (
        <div className="grid min-h-32 grid-cols-[2rem_8.5rem_minmax(0,1fr)] items-center gap-[0.85rem] border-t border-[#d5e2e4] first:border-t-0 max-[559px]:grid-cols-[1.5rem_minmax(0,1fr)]" key={rowIndex}>
          <span className="h-[0.65rem] animate-pulse rounded-full bg-[#e5eeee] motion-reduce:animate-none" />
          <span className="h-[6.25rem] animate-pulse rounded-[0.58rem] bg-[#e5eeee] motion-reduce:animate-none max-[559px]:h-40" />
          <span className="h-[0.65rem] w-[72%] animate-pulse self-start rounded-full bg-[#e5eeee] mt-6 motion-reduce:animate-none max-[559px]:col-start-2 max-[559px]:m-0 max-[559px]:mb-4" />
        </div>
      ))}
    </div>
  );
}

export default function StudentEvidenceSection({
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

  const loadEvidences = useCallback(async ({ signal } = {}) => {
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
      const evidenceList = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== requestSequence.current) return;
      const visibleEvidences = evidenceList.slice(0, 6);
      setResource({
        status: 'success',
        data: visibleEvidences,
        error: null,
      });
      setSelectedEvidence((currentEvidence) => {
        if (!currentEvidence) return null;

        const refreshedEvidence = evidenceList.find(
          (evidence) => String(evidence.id) === String(currentEvidence.id)
        );
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
    loadEvidences({ signal: requestController.signal });
    return () => {
      requestController.abort();
      requestSequence.current += 1;
    };
  }, [loadEvidences, refreshKey, retryKey]);

  useEffect(() => {
    setSelectedEvidence(null);
  }, [studentId]);

  return (
    <>
      <section
        className="relative overflow-hidden rounded-[0.9rem_0.9rem_2.35rem_0.9rem] border border-[#b8d3d7] bg-[#f8fcfc] min-[900px]:col-span-2"
        style={{ boxShadow: '0.46rem 0.5rem 0 rgba(66, 111, 120, 0.09)' }}
        aria-labelledby="parent-evidence-title"
        aria-busy={resource.status === 'loading'}
      >
        <header
          className="border-b border-[#c6dadd] px-[1.35rem] pb-[1.05rem] pt-[1.2rem]"
          style={{ backgroundImage: 'linear-gradient(108deg, #e5f3f4, #f8fcfc 68%)' }}
        >
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Bukti perkembangan</p>
          <h2
            className="mt-[0.24rem] text-[1.28rem] [font-weight:850] tracking-[-0.025em] text-[var(--issa-text)]"
            id="parent-evidence-title"
            ref={sectionHeadingRef}
            tabIndex="-1"
          >
            Dokumentasi belajar terbaru
          </h2>
          <span className="mt-[0.35rem] block text-[0.82rem] text-[var(--issa-text-secondary)]">Foto record pembelajaran yang dibagikan oleh guru.</span>
        </header>

        {resource.status === 'loading' && <EvidenceSkeleton />}
        {resource.status === 'error' && (
          <EvidenceStateMessage
            tone="error"
            title="Dokumentasi belum dapat dimuat."
            description={resource.error?.message || 'Silakan coba beberapa saat lagi.'}
            onRetry={() => setRetryKey((current) => current + 1)}
          />
        )}
        {resource.status === 'success' && resource.data.length === 0 && (
          <EvidenceStateMessage
            tone="empty"
            title="Belum ada dokumentasi perkembangan yang dibagikan."
          />
        )}
        {resource.status === 'success' && resource.data.length > 0 && (
          <ol className="m-0 list-none px-5 min-[900px]:grid min-[900px]:grid-cols-2">
            {resource.data.map((evidence, index) => (
              <li className={`grid grid-cols-[2rem_8.5rem_minmax(0,1fr)] items-start gap-[0.85rem] border-t border-[#d5e2e4] py-4 first:border-t-0 max-[559px]:grid-cols-[1.5rem_minmax(0,1fr)] ${index % 2 === 1 ? 'min-[900px]:border-l min-[900px]:pl-4' : ''} ${index === 1 ? 'min-[900px]:border-t-0' : ''}`} key={evidence.id}>
                <span className="pt-[0.22rem] text-[0.66rem] [font-weight:850] tracking-[0.08em] text-[#778d92]" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="group h-[6.25rem] w-[8.5rem] cursor-zoom-in overflow-hidden rounded-[0.58rem_0.38rem_0.8rem_0.4rem] border border-[#a9c6ca] bg-[#dfecef] p-0 max-[559px]:col-start-2 max-[559px]:h-44 max-[559px]:w-full"
                  onClick={() => setSelectedEvidence(evidence)}
                  aria-label={`Buka gambar ${evidence.title}`}
                >
                  <img className="block h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.035] motion-reduce:transition-none" src={evidence.file?.url} alt={evidence.title} />
                </button>
                <div className="min-w-0 max-[559px]:col-start-2">
                  <div className="flex flex-wrap justify-between gap-[0.45rem]">
                    <span className="text-[0.64rem] [font-weight:850] uppercase tracking-[0.06em] text-[#3d747a]">{evidenceCategoryLabels[evidence.category] || evidence.category}</span>
                    <time className="text-[0.7rem] text-[#74868b]" dateTime={evidence.observedAt}>
                      {formatEvidenceObservedDate(evidence.observedAt)}
                    </time>
                  </div>
                  <h3 className="mt-[0.3rem] text-[0.92rem] font-extrabold text-[var(--issa-text)]">{evidence.title}</h3>
                  {evidence.description && <p className="mt-[0.36rem] overflow-hidden whitespace-pre-wrap text-[0.78rem] leading-[1.55] text-[var(--issa-text-secondary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{evidence.description}</p>}
                  <small className="mt-2 block text-[0.68rem] text-[#728287]">Guru: {evidence.teacher?.name || '-'}</small>
                </div>
              </li>
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
