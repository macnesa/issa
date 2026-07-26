import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../studentEvidence.constants';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import EvidenceViewer from './EvidenceViewer';
import './StudentEvidenceSection.css';

function EvidenceStateMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`parent-evidence__message parent-evidence__message--${tone}`}>
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

function EvidenceSkeleton() {
  return (
    <div className="parent-evidence__skeleton" aria-label="Memuat bukti perkembangan">
      {[0, 1].map((rowIndex) => (
        <div key={rowIndex}>
          <span />
          <span />
          <span />
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
      setResource({
        status: 'success',
        data: evidenceList.slice(0, 6),
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
    loadEvidences({ signal: requestController.signal });
    return () => {
      requestController.abort();
      requestSequence.current += 1;
    };
  }, [loadEvidences, refreshKey, retryKey]);

  return (
    <>
      <section
        className="parent-evidence"
        aria-labelledby="parent-evidence-title"
        aria-busy={resource.status === 'loading'}
      >
        <header className="parent-evidence__header">
          <p className="overview-kicker">Bukti perkembangan</p>
          <h2 id="parent-evidence-title">Dokumentasi belajar terbaru</h2>
          <span>Foto record pembelajaran yang dibagikan oleh guru.</span>
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
          <ol className="parent-evidence__list">
            {resource.data.map((evidence, index) => (
              <li key={evidence.id}>
                <span className="parent-evidence__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="parent-evidence__thumbnail"
                  onClick={() => setSelectedEvidence(evidence)}
                  aria-label={`Buka gambar ${evidence.title}`}
                >
                  <img src={evidence.file?.url} alt={evidence.title} />
                </button>
                <div className="parent-evidence__copy">
                  <div>
                    <span>{evidenceCategoryLabels[evidence.category] || evidence.category}</span>
                    <time dateTime={evidence.observedAt}>
                      {formatEvidenceObservedDate(evidence.observedAt)}
                    </time>
                  </div>
                  <h3>{evidence.title}</h3>
                  {evidence.description && <p>{evidence.description}</p>}
                  <small>Guru: {evidence.teacher?.name || '-'}</small>
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
