import { useCallback, useEffect, useRef, useState } from 'react';
import normalizeApiError from '../../../utils/normalizeApiError';
import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../studentEvidence.constants';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import EvidenceViewer from './EvidenceViewer';
const studentEvidenceStyles = String.raw`
.parent-evidence {
  position: relative;
  overflow: hidden;
  border: 1px solid #b8d3d7;
  border-radius: 0.9rem 0.9rem 2.35rem 0.9rem;
  background: #f8fcfc;
  box-shadow: 0.46rem 0.5rem 0 rgba(66, 111, 120, 0.09);
}

.parent-evidence__header {
  padding: 1.2rem 1.35rem 1.05rem;
  border-bottom: 1px solid #c6dadd;
  background: linear-gradient(108deg, #e5f3f4, #f8fcfc 68%);
}

.parent-evidence__header h2 {
  margin: 0.24rem 0 0;
  color: var(--issa-text);
  font-size: 1.28rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.parent-evidence__header > span {
  display: block;
  margin-top: 0.35rem;
  color: var(--issa-text-secondary);
  font-size: 0.82rem;
}

.parent-evidence__list {
  margin: 0;
  padding: 0 1.25rem;
  list-style: none;
}

.parent-evidence__list li {
  display: grid;
  grid-template-columns: 2rem 8.5rem minmax(0, 1fr);
  align-items: start;
  gap: 0.85rem;
  padding: 1rem 0;
}

.parent-evidence__list li + li {
  border-top: 1px solid #d5e2e4;
}

.parent-evidence__index {
  padding-top: 0.22rem;
  color: #778d92;
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.parent-evidence__thumbnail {
  overflow: hidden;
  width: 8.5rem;
  height: 6.25rem;
  border: 1px solid #a9c6ca;
  border-radius: 0.58rem 0.38rem 0.8rem 0.4rem;
  background: #dfecef;
  padding: 0;
  cursor: zoom-in;
}

.parent-evidence__thumbnail img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}

.parent-evidence__thumbnail:hover img {
  transform: scale(1.035);
}

.parent-evidence__copy {
  min-width: 0;
}

.parent-evidence__copy > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.45rem;
}

.parent-evidence__copy > div span {
  color: #3d747a;
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.parent-evidence__copy time {
  color: #74868b;
  font-size: 0.7rem;
}

.parent-evidence__copy h3 {
  margin: 0.3rem 0 0;
  color: var(--issa-text);
  font-size: 0.92rem;
  font-weight: 800;
}

.parent-evidence__copy p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.36rem 0 0;
  color: var(--issa-text-secondary);
  font-size: 0.78rem;
  line-height: 1.55;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.parent-evidence__copy small {
  display: block;
  margin-top: 0.5rem;
  color: #728287;
  font-size: 0.68rem;
}

.parent-evidence__message {
  display: grid;
  min-height: 7rem;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.25rem;
}

.parent-evidence__message--error {
  border-left: 0.28rem solid var(--issa-danger);
  background: #fffafa;
}

.parent-evidence__message > span {
  color: #7b9095;
  font-size: 0.74rem;
  font-weight: 850;
}

.parent-evidence__message strong {
  color: var(--issa-text);
  font-size: 0.88rem;
}

.parent-evidence__message p {
  margin: 0.25rem 0 0;
  color: var(--issa-text-secondary);
  font-size: 0.76rem;
}

.parent-evidence__message button {
  min-height: 2.45rem;
  border-radius: 0.58rem;
  background: var(--issa-primary);
  padding: 0.48rem 0.78rem;
  color: white;
  font-size: 0.76rem;
  font-weight: 750;
}

.parent-evidence__skeleton {
  display: grid;
  padding: 0 1.25rem;
}

.parent-evidence__skeleton > div {
  display: grid;
  min-height: 8rem;
  grid-template-columns: 2rem 8.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
}

.parent-evidence__skeleton > div + div {
  border-top: 1px solid #d5e2e4;
}

.parent-evidence__skeleton span {
  height: 0.65rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #e5eeee, #f7fbfb, #e5eeee);
  background-size: 220% 100%;
  animation: parent-evidence-shimmer 1.15s linear infinite;
}

.parent-evidence__skeleton span:nth-child(2) {
  height: 6.25rem;
  border-radius: 0.58rem;
}

.parent-evidence__skeleton span:nth-child(3) {
  align-self: start;
  width: 72%;
  margin-top: 1.5rem;
}

@keyframes parent-evidence-shimmer {
  to { background-position: -220% 0; }
}

@media (min-width: 900px) {
  .parent-evidence {
    grid-column: 1 / -1;
  }

  .parent-evidence__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .parent-evidence__list li:nth-child(even) {
    border-left: 1px solid #d5e2e4;
    padding-left: 1rem;
  }

  .parent-evidence__list li:nth-child(2) {
    border-top: 0;
  }
}

@media (max-width: 559px) {
  .parent-evidence__list li {
    grid-template-columns: 1.5rem minmax(0, 1fr);
  }

  .parent-evidence__thumbnail {
    width: 100%;
    height: 11rem;
    grid-column: 2;
  }

  .parent-evidence__copy {
    grid-column: 2;
  }

  .parent-evidence__message {
    grid-template-columns: 1.5rem minmax(0, 1fr);
  }

  .parent-evidence__message button {
    grid-column: 2;
    justify-self: start;
  }

  .parent-evidence__skeleton > div {
    grid-template-columns: 1.5rem minmax(0, 1fr);
  }

  .parent-evidence__skeleton span:nth-child(2) {
    height: 10rem;
  }

  .parent-evidence__skeleton span:nth-child(3) {
    grid-column: 2;
    margin: 0 0 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .parent-evidence__thumbnail img,
  .parent-evidence__skeleton span {
    animation: none;
    transition: none;
  }
}
`;

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
      <style>{studentEvidenceStyles}</style>
      <section
        className="parent-evidence"
        aria-labelledby="parent-evidence-title"
        aria-busy={resource.status === 'loading'}
      >
        <header className="parent-evidence__header">
          <p className="overview-kicker">Bukti perkembangan</p>
          <h2
            id="parent-evidence-title"
            ref={sectionHeadingRef}
            tabIndex="-1"
          >
            Dokumentasi belajar terbaru
          </h2>
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
