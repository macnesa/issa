import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import { Button, SectionHeader } from '../../../shared/ui/ui';
import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../studentEvidence.constants';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import EvidenceViewer from './EvidenceViewer';

function EvidenceStateMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`record-message record-message--${tone}`}>
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {onRetry && <Button compact onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}

function EvidenceSkeleton() {
  return (
    <div className="record-skeleton" aria-label="Memuat bukti perkembangan">
      {[0, 1].map((rowIndex) => <span key={rowIndex} />)}
    </div>
  );
}

export default function StudentEvidenceSection({ studentId, refreshKey = 0 }) {
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
    window.requestAnimationFrame(() => sectionHeadingRef.current?.focus());
  }, []);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    if (!studentId) {
      setResource({ status: 'success', data: [], error: null });
      return;
    }

    const requestId = ++requestSequence.current;
    setResource((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const evidenceList = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({ status: 'success', data: evidenceList.slice(0, 6), error: null });
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
      setResource({ status: 'error', data: [], error: normalizeApiError(apiError) });
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

  useEffect(() => setSelectedEvidence(null), [studentId]);

  return (
    <>
      <section
        className="surface surface--full record-section"
        aria-labelledby="parent-evidence-title"
        aria-busy={resource.status === 'loading'}
      >
        <SectionHeader
          kicker="Bukti perkembangan"
          title="Dokumentasi belajar terbaru"
          description="Foto record pembelajaran yang dibagikan oleh guru."
          titleId="parent-evidence-title"
          titleRef={sectionHeadingRef}
        />

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
          <ol className="evidence-list">
            {resource.data.map((evidence, index) => (
              <li key={evidence.id}>
                <span className="evidence-list__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="evidence-list__image"
                  onClick={() => setSelectedEvidence(evidence)}
                  aria-label={`Buka gambar ${evidence.title}`}
                >
                  <img src={evidence.file?.url} alt={evidence.title} />
                </button>
                <article>
                  <div className="evidence-list__meta">
                    <span>{evidenceCategoryLabels[evidence.category] || evidence.category}</span>
                    <time dateTime={evidence.observedAt}>
                      {formatEvidenceObservedDate(evidence.observedAt)}
                    </time>
                  </div>
                  <h3>{evidence.title}</h3>
                  {evidence.description && <p>{evidence.description}</p>}
                  <small>Guru: {evidence.teacher?.name || '-'}</small>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      <EvidenceViewer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
    </>
  );
}
