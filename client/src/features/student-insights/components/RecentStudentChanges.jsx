import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../../config/apiClient';
import normalizeApiError from '../../../utils/normalizeApiError';
const recentStudentChangesStyles = String.raw`
.recent-student-changes {
  --recent-score: #8d5db3;
  --recent-score-soft: #f0e8f8;
  --recent-attendance: #4f9993;
  --recent-attendance-soft: #e1f3ef;
  --recent-feedback: #b88b2f;
  --recent-feedback-soft: #fff3c9;
  position: relative;
  overflow: hidden;
  border: 1px solid #d7cba9;
  border-radius: 0.9rem 2.3rem 0.9rem 0.9rem;
  background: #fffdf5;
  box-shadow: 0.46rem 0.5rem 0 rgba(125, 101, 47, 0.09);
}

.recent-student-changes__header {
  position: relative;
  z-index: 1;
  padding: 1.25rem 1.35rem 1.05rem;
  border-bottom: 1px solid #ddd2b6;
  background: linear-gradient(90deg, rgba(255, 247, 214, 0.76), rgba(255, 253, 245, 0.76) 62%);
}

.recent-student-changes__header h2 {
  margin: 0.24rem 0 0;
  color: var(--issa-text);
  font-size: 1.28rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.recent-student-changes__header > p:last-child {
  max-width: 44rem;
  margin: 0.35rem 0 0;
  color: var(--issa-text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.recent-student-changes__context {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-bottom: 1px solid #ddd2b6;
  background: rgba(255, 253, 245, 0.84);
}

.recent-student-changes__context > div {
  display: grid;
  min-height: 4.5rem;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.35rem;
}

.recent-student-changes__context > div + div {
  border-left: 1px solid #ddd2b6;
}

.recent-student-changes__context dt {
  color: #7c704f;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.recent-student-changes__context dd {
  margin: 0;
  color: #4d4430;
  font-size: 1.12rem;
  font-weight: 850;
}

.recent-student-changes__timeline {
  position: relative;
  z-index: 1;
  max-height: 26rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  background: rgba(255, 253, 245, 0.7);
  list-style: none;
  overscroll-behavior: contain;
}

.recent-student-changes__timeline::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4.64rem;
  width: 1px;
  background: #d9ccb0;
  content: "";
}

.recent-student-changes__item {
  position: relative;
  display: grid;
  min-height: 6rem;
  grid-template-columns: 2.4rem 1.05rem minmax(0, 1fr) minmax(8rem, auto);
  align-items: start;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1rem 1.15rem;
}

.recent-student-changes__item + .recent-student-changes__item {
  border-top: 1px solid rgba(217, 204, 176, 0.72);
}

.recent-student-changes__index {
  padding-top: 0.22rem;
  color: #8f8366;
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.recent-student-changes__marker {
  position: relative;
  z-index: 1;
  width: 0.78rem;
  height: 0.78rem;
  margin-top: 0.18rem;
  border: 0.18rem solid #fffdf5;
  border-radius: 48% 52% 46% 54%;
  background: var(--recent-feedback);
  box-shadow: 0 0 0 1px var(--recent-feedback);
}

[data-domain="score"] .recent-student-changes__marker {
  background: var(--recent-score);
  box-shadow: 0 0 0 1px var(--recent-score);
}

[data-domain="attendance"] .recent-student-changes__marker {
  background: var(--recent-attendance);
  box-shadow: 0 0 0 1px var(--recent-attendance);
}

.recent-student-changes__copy {
  min-width: 0;
}

.recent-student-changes__domain {
  display: inline-flex;
  border: 1px solid #d5b85c;
  border-radius: 0.42rem 0.3rem 0.55rem 0.3rem;
  background: var(--recent-feedback-soft);
  padding: 0.25rem 0.45rem;
  color: #80601f;
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.05em;
  line-height: 1.2;
  text-transform: uppercase;
}

[data-domain="score"] .recent-student-changes__domain {
  border-color: #cbb2df;
  background: var(--recent-score-soft);
  color: #674482;
}

[data-domain="attendance"] .recent-student-changes__domain {
  border-color: #a9d3cd;
  background: var(--recent-attendance-soft);
  color: #346e69;
}

.recent-student-changes__copy > p {
  margin: 0.43rem 0 0;
  color: var(--issa-text);
  font-size: 0.88rem;
  font-weight: 760;
  line-height: 1.48;
}

.recent-student-changes__notation {
  display: inline-block;
  margin-top: 0.3rem;
  color: #786d53;
  font-size: 0.72rem;
  font-weight: 750;
}

.recent-student-changes__context-note {
  display: block;
  max-width: 42rem;
  margin-top: 0.42rem;
  padding-left: 0.55rem;
  border-left: 2px solid #c8bfa8;
  color: #756c57;
  font-size: 0.7rem;
  line-height: 1.5;
}

.recent-student-changes__copy blockquote {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.42rem 0 0;
  color: #695d3d;
  font-family: Georgia, serif;
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.recent-student-changes__copy blockquote::before { content: "“"; }
.recent-student-changes__copy blockquote::after { content: "”"; }

.recent-student-changes__item time {
  justify-self: end;
  padding-top: 0.24rem;
  color: #81775e;
  font-size: 0.72rem;
  font-weight: 720;
  text-align: right;
}

.recent-student-changes__message {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 6.5rem;
  grid-template-columns: 2.4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 253, 245, 0.82);
}

.recent-student-changes__message--error {
  border-left: 0.28rem solid #bc5b54;
  background: rgba(255, 241, 237, 0.9);
}

.recent-student-changes__message-index {
  color: #978b70;
  font-size: 0.75rem;
  font-weight: 850;
}

.recent-student-changes__message strong {
  color: var(--issa-text);
  font-size: 0.88rem;
}

.recent-student-changes__message p {
  margin: 0.25rem 0 0;
  color: var(--issa-text-secondary);
  font-size: 0.78rem;
  line-height: 1.48;
}

.recent-student-changes__retry {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid #b56a63;
  border-radius: 0.55rem 0.36rem 0.72rem 0.38rem;
  background: #fffdf9;
  padding: 0.55rem 0.85rem;
  color: #8d403a;
  font-size: 0.78rem;
  font-weight: 800;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.recent-student-changes__retry:hover {
  border-color: #8d403a;
  background: #fff4ef;
}

.recent-student-changes__skeleton {
  position: relative;
  z-index: 1;
  background: rgba(255, 253, 245, 0.82);
}

.recent-student-changes__skeleton-context {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-bottom: 1px solid #ddd2b6;
}

.recent-student-changes__skeleton-context span {
  height: 2rem;
  margin: 1.15rem 1.35rem;
}

.recent-student-changes__skeleton-context span + span {
  border-left: 1px solid #ddd2b6;
}

.recent-student-changes__skeleton-row {
  display: grid;
  min-height: 6rem;
  grid-template-columns: 2.4rem 1.05rem minmax(0, 1fr) 7.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1rem 1.15rem;
}

.recent-student-changes__skeleton-row + .recent-student-changes__skeleton-row {
  border-top: 1px solid rgba(217, 204, 176, 0.72);
}

.recent-student-changes__skeleton span {
  display: block;
  border-radius: 0.32rem;
  background: linear-gradient(90deg, #eee8d9, #faf8f0 50%, #eee8d9);
  background-size: 200% 100%;
  animation: recent-record-loading 1.35s ease-in-out infinite;
}

.recent-student-changes__skeleton-index { width: 1.25rem; height: 0.62rem; }
.recent-student-changes__skeleton-marker { width: 0.78rem; height: 0.78rem; border-radius: 50% !important; }
.recent-student-changes__skeleton-copy { width: 82%; height: 2.4rem; }
.recent-student-changes__skeleton-date { width: 6.8rem; height: 0.72rem; justify-self: end; }

@keyframes recent-record-loading {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}

@media (min-width: 900px) {
  .recent-student-changes {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .recent-student-changes__header {
    padding: 1.1rem;
  }

  .recent-student-changes__context {
    grid-template-columns: 1fr;
  }

  .recent-student-changes__context > div {
    min-height: 3.9rem;
    padding: 0.75rem 1.1rem;
  }

  .recent-student-changes__context > div + div {
    border-top: 1px solid #ddd2b6;
    border-left: 0;
  }

  .recent-student-changes__timeline {
    max-height: 31rem;
  }

  .recent-student-changes__timeline::before {
    left: 3.77rem;
  }

  .recent-student-changes__item {
    grid-template-columns: 1.8rem 0.95rem minmax(0, 1fr);
    gap: 0.65rem;
    padding: 0.95rem 1rem 0.95rem 0.85rem;
  }

  .recent-student-changes__item time {
    grid-column: 3;
    grid-row: 1;
    justify-self: start;
    margin-left: 6.4rem;
    padding-top: 0.12rem;
  }

  .recent-student-changes__copy {
    grid-column: 3;
  }

  .recent-student-changes__message {
    grid-template-columns: 1.8rem minmax(0, 1fr);
    padding: 1rem;
  }

  .recent-student-changes__retry {
    grid-column: 2;
    justify-self: start;
  }

  .recent-student-changes__skeleton-context {
    grid-template-columns: 1fr;
  }

  .recent-student-changes__skeleton-context span {
    margin: 0.95rem 1.1rem;
  }

  .recent-student-changes__skeleton-context span + span {
    border-top: 1px solid #ddd2b6;
    border-left: 0;
  }

  .recent-student-changes__skeleton-row {
    grid-template-columns: 1.8rem 0.95rem minmax(0, 1fr);
    gap: 0.65rem;
    padding: 0.95rem 1rem 0.95rem 0.85rem;
  }

  .recent-student-changes__skeleton-copy {
    width: 100%;
  }

  .recent-student-changes__skeleton-date {
    grid-column: 3;
    width: 55%;
    justify-self: start;
  }
}

@media (max-width: 399px) {
  .recent-student-changes__header {
    padding: 1rem;
  }

  .recent-student-changes__context > div {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .recent-student-changes__item time {
    margin-left: 0;
    grid-row: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recent-student-changes__skeleton span {
    animation: none;
  }

  .recent-student-changes__retry {
    transition: none;
  }
}
`;

const academicTrendLabels = {
  improving: 'Pola nilai meningkat',
  declining: 'Pola nilai menurun',
  stable: 'Pola nilai stabil',
  insufficient_data: 'Belum cukup data',
};

const domainLabels = {
  score: 'Pengukuran akademik',
  attendance: 'Data faktual',
  feedback: 'Observasi guru',
};

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateOnlyFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatRecordDate(occurredAt) {
  if (typeof occurredAt !== 'string' || occurredAt.trim() === '') return 'Tanggal tidak tersedia';

  if (/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) {
    const [year, month, day] = occurredAt.split('-').map(Number);
    const dateOnlyValue = new Date(Date.UTC(year, month - 1, day));
    return dateOnlyFormatter.format(dateOnlyValue);
  }

  const recordDate = new Date(occurredAt);
  return Number.isNaN(recordDate.getTime())
    ? 'Tanggal tidak tersedia'
    : dateFormatter.format(recordDate);
}

function formatScoreValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : '—';
}

function getScoreChangeCopy(change) {
  const lessonName = change.lessonName || 'pelajaran';
  const currentValue = formatScoreValue(change.value);
  const hasPreviousValue = change.previousValue !== null
    && change.previousValue !== undefined
    && change.previousValue !== '';
  return hasPreviousValue
    ? `Nilai terbaru ${lessonName} adalah ${currentValue}, setelah sebelumnya ${formatScoreValue(change.previousValue)}.`
    : `Nilai terbaru ${lessonName} adalah ${currentValue}.`;
}

function getKkmContext(change) {
  const currentValue = Number(change.value);
  const kkm = Number(change.kkm);
  if (!Number.isFinite(currentValue) || !Number.isFinite(kkm)) return null;

  if (currentValue > kkm) {
    return `Nilai masih berada di atas KKM ${formatScoreValue(kkm)}.`;
  }
  if (currentValue === kkm) {
    return `Nilai terbaru memenuhi KKM ${formatScoreValue(kkm)}.`;
  }
  return `KKM saat ini adalah ${formatScoreValue(kkm)}. Guru dapat menambahkan konteks mengenai assessment dan dukungan berikutnya.`;
}

function getChangeContent(change) {
  if (change.type === 'score') {
    return {
      title: getScoreChangeCopy(change),
      detail: getKkmContext(change),
      context: 'Angka ini adalah pengukuran pada assessment yang tercatat, bukan kesimpulan tentang kemampuan siswa.',
    };
  }

  if (change.type === 'attendance') {
    return {
      title: `Status kehadiran pada ${formatRecordDate(change.occurredAt)} tercatat sebagai ${change.status}.`,
      detail: null,
      context: 'Catatan ini menunjukkan status yang dilaporkan tanpa menyimpulkan penyebabnya.',
    };
  }

  if (change.type === 'feedback') {
    return {
      title: 'Observasi guru baru ditambahkan.',
      detail: change.content || null,
      context: 'Catatan ini merupakan observasi guru pada waktu pencatatan.',
    };
  }

  return {
    title: 'Catatan perkembangan baru tersedia.',
    detail: null,
    context: 'Konteks tambahan belum tersedia.',
  };
}

function RecentChangesSkeleton() {
  return (
    <div className="recent-student-changes__skeleton" aria-label="Memuat perubahan terbaru">
      <div className="recent-student-changes__skeleton-context">
        <span />
        <span />
      </div>
      {[0, 1, 2].map((rowIndex) => (
        <div className="recent-student-changes__skeleton-row" key={rowIndex}>
          <span className="recent-student-changes__skeleton-index" />
          <span className="recent-student-changes__skeleton-marker" />
          <span className="recent-student-changes__skeleton-copy" />
          <span className="recent-student-changes__skeleton-date" />
        </div>
      ))}
    </div>
  );
}

function RecentChangesMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`recent-student-changes__message recent-student-changes__message--${tone}`}>
      <span className="recent-student-changes__message-index" aria-hidden="true">—</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {onRetry && (
        <button type="button" className="recent-student-changes__retry" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

function RecentChangeItem({ change, index }) {
  const content = getChangeContent(change);
  const domain = domainLabels[change.type] ? change.type : 'feedback';

  return (
    <li className="recent-student-changes__item" data-domain={domain}>
      <span className="recent-student-changes__index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="recent-student-changes__marker" aria-hidden="true" />
      <div className="recent-student-changes__copy">
        <span className="recent-student-changes__domain">{domainLabels[domain]}</span>
        <p>{content.title}</p>
        {content.detail && (
          change.type === 'feedback'
            ? <blockquote>{content.detail}</blockquote>
            : <span className="recent-student-changes__notation">{content.detail}</span>
        )}
        {content.context && (
          <span className="recent-student-changes__context-note">
            {content.context}
          </span>
        )}
      </div>
      <time dateTime={change.occurredAt || undefined}>
        {formatRecordDate(change.occurredAt)}
      </time>
    </li>
  );
}

export default function RecentStudentChanges({ studentId, refreshKey = 0 }) {
  const [status, setStatus] = useState(studentId ? 'loading' : 'success');
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const requestedResourceKey = useRef(null);

  const loadStudentInsights = useCallback(async () => {
    if (!studentId) {
      setInsights(null);
      setStatus('success');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const { data: studentInsights } = await apiClient.get(
        `/students/${studentId}/insights`
      );
      setInsights(studentInsights && typeof studentInsights === 'object'
        ? studentInsights
        : null);
      setStatus('success');
    } catch (apiError) {
      setError(normalizeApiError(apiError));
      setStatus('error');
    }
  }, [studentId]);

  useEffect(() => {
    const resourceKey = `${studentId || 'none'}:${refreshKey}`;
    if (!studentId || requestedResourceKey.current === resourceKey) return;
    requestedResourceKey.current = resourceKey;
    loadStudentInsights();
  }, [loadStudentInsights, refreshKey, studentId]);

  const recentChanges = Array.isArray(insights?.recentChanges)
    ? insights.recentChanges.slice(0, 6)
    : [];
  const recordedDays = Number(insights?.attendance?.recordedDays);
  const attendanceRate = Number(insights?.attendance?.rate);
  const attendanceRateLabel = recordedDays > 0 && Number.isFinite(attendanceRate)
    ? `${numberFormatter.format(attendanceRate)}%`
    : '—';
  const academicTrendLabel =
    academicTrendLabels[insights?.academics?.overallTrend] || '—';

  return (
    <>
      <style>{recentStudentChangesStyles}</style>
      <section
        className="recent-student-changes"
      aria-labelledby="recent-student-changes-title"
      aria-busy={status === 'loading'}
    >
      <header className="recent-student-changes__header">
        <p className="overview-kicker">Student insights</p>
        <h2 id="recent-student-changes-title">Perubahan terbaru</h2>
        <p>
          Ringkasan data faktual, pengukuran akademik, dan observasi guru.
        </p>
      </header>

      {status === 'loading' && <RecentChangesSkeleton />}
      {status === 'error' && (
        <RecentChangesMessage
          tone="error"
          title="Perubahan terbaru belum dapat dimuat."
          description={error?.message || 'Silakan coba beberapa saat lagi.'}
          onRetry={loadStudentInsights}
        />
      )}
      {status === 'success' && (
        <>
          <dl className="recent-student-changes__context">
            <div>
              <dt>Kehadiran 30 hari</dt>
              <dd>{attendanceRateLabel}</dd>
            </div>
            <div>
              <dt>Interpretasi sistem · tren nilai</dt>
              <dd>{academicTrendLabel}</dd>
            </div>
          </dl>

          {recentChanges.length === 0 ? (
            <RecentChangesMessage
              tone="empty"
              title="Belum ada perubahan terbaru untuk ditampilkan."
              description="Catatan kehadiran, pengukuran akademik, dan observasi guru baru akan muncul di sini."
            />
          ) : (
            <ol className="recent-student-changes__timeline">
              {recentChanges.map((change, index) => (
                <RecentChangeItem
                  key={`${change.type}-${change.occurredAt || 'unknown'}-${index}`}
                  change={change}
                  index={index}
                />
              ))}
            </ol>
          )}
        </>
      )}
      </section>
    </>
  );
}
