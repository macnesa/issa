import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../../config/apiClient';
import normalizeApiError from '../../../utils/normalizeApiError';

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
const domainPresentation = {
  score: {
    marker: { backgroundColor: '#8d5db3', boxShadow: '0 0 0 1px #8d5db3' },
    label: { borderColor: '#cbb2df', backgroundColor: '#f0e8f8', color: '#674482' },
  },
  attendance: {
    marker: { backgroundColor: '#4f9993', boxShadow: '0 0 0 1px #4f9993' },
    label: { borderColor: '#a9d3cd', backgroundColor: '#e1f3ef', color: '#346e69' },
  },
  feedback: {
    marker: { backgroundColor: '#b88b2f', boxShadow: '0 0 0 1px #b88b2f' },
    label: { borderColor: '#d5b85c', backgroundColor: '#fff3c9', color: '#80601f' },
  },
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
    <div className="relative z-[1] bg-[rgba(255,253,245,0.82)]" aria-label="Memuat perubahan terbaru">
      <div className="grid grid-cols-2 border-b border-[#ddd2b6] max-[639px]:grid-cols-1">
        <span className="mx-[1.35rem] my-[1.15rem] block h-8 animate-pulse rounded-[0.32rem] bg-[#eee8d9] motion-reduce:animate-none max-[639px]:mx-[1.1rem] max-[639px]:my-[0.95rem]" />
        <span className="mx-[1.35rem] my-[1.15rem] block h-8 animate-pulse rounded-[0.32rem] border-l border-[#ddd2b6] bg-[#eee8d9] motion-reduce:animate-none max-[639px]:mx-[1.1rem] max-[639px]:my-[0.95rem] max-[639px]:border-l-0 max-[639px]:border-t" />
      </div>
      {[0, 1, 2].map((rowIndex) => (
        <div className="grid min-h-24 grid-cols-[2.4rem_1.05rem_minmax(0,1fr)_7.5rem] items-center gap-[0.75rem] border-t border-[rgba(217,204,176,0.72)] px-5 py-4 first:border-t-0 max-[639px]:grid-cols-[1.8rem_0.95rem_minmax(0,1fr)] max-[639px]:gap-[0.65rem] max-[639px]:py-[0.95rem] max-[639px]:pl-[0.85rem] max-[639px]:pr-4" key={rowIndex}>
          <span className="block h-[0.62rem] w-5 animate-pulse rounded-[0.32rem] bg-[#eee8d9] motion-reduce:animate-none" />
          <span className="block h-[0.78rem] w-[0.78rem] animate-pulse rounded-full bg-[#eee8d9] motion-reduce:animate-none" />
          <span className="block h-[2.4rem] w-[82%] animate-pulse rounded-[0.32rem] bg-[#eee8d9] motion-reduce:animate-none max-[639px]:w-full" />
          <span className="block h-[0.72rem] w-[6.8rem] animate-pulse justify-self-end rounded-[0.32rem] bg-[#eee8d9] motion-reduce:animate-none max-[639px]:col-start-3 max-[639px]:w-[55%] max-[639px]:justify-self-start" />
        </div>
      ))}
    </div>
  );
}

function RecentChangesMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`relative z-[1] grid min-h-[6.5rem] grid-cols-[2.4rem_minmax(0,1fr)_auto] items-center gap-[0.8rem] bg-[rgba(255,253,245,0.82)] px-5 py-4 max-[639px]:grid-cols-[1.8rem_minmax(0,1fr)] max-[639px]:p-4 ${tone === 'error' ? 'border-l-[0.28rem] border-[#bc5b54] !bg-[rgba(255,241,237,0.9)]' : ''}`}>
      <span className="text-[0.75rem] [font-weight:850] text-[#978b70]" aria-hidden="true">—</span>
      <div>
        <strong className="text-[0.88rem] text-[var(--issa-text)]">{title}</strong>
        <p className="mt-1 text-[0.78rem] leading-[1.48] text-[var(--issa-text-secondary)]">{description}</p>
      </div>
      {onRetry && (
        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[0.55rem_0.36rem_0.72rem_0.38rem] border border-[#b56a63] bg-[#fffdf9] px-[0.85rem] py-[0.55rem] text-[0.78rem] font-extrabold text-[#8d403a] transition-colors duration-150 hover:border-[#8d403a] hover:bg-[#fff4ef] motion-reduce:transition-none max-[639px]:col-start-2 max-[639px]:justify-self-start" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

function RecentChangeItem({ change, index }) {
  const content = getChangeContent(change);
  const domain = domainLabels[change.type] ? change.type : 'feedback';
  const presentation = domainPresentation[domain];

  return (
    <li className="relative grid min-h-24 grid-cols-[2.4rem_1.05rem_minmax(0,1fr)_minmax(8rem,auto)] items-start gap-[0.75rem] border-t border-[rgba(217,204,176,0.72)] px-5 py-4 pl-[1.15rem] first:border-t-0 max-[639px]:grid-cols-[1.8rem_0.95rem_minmax(0,1fr)] max-[639px]:gap-[0.65rem] max-[639px]:py-[0.95rem] max-[639px]:pl-[0.85rem] max-[639px]:pr-4">
      <span className="pt-[0.22rem] text-[0.68rem] [font-weight:850] tracking-[0.08em] text-[#8f8366]" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="relative z-[1] mt-[0.18rem] h-[0.78rem] w-[0.78rem] rounded-[48%_52%_46%_54%] border-[0.18rem] border-[#fffdf5]" style={presentation.marker} aria-hidden="true" />
      <div className="min-w-0 max-[639px]:col-start-3">
        <span className="inline-flex rounded-[0.42rem_0.3rem_0.55rem_0.3rem] border px-[0.45rem] py-1 text-[0.64rem] [font-weight:850] uppercase leading-[1.2] tracking-[0.05em]" style={presentation.label}>{domainLabels[domain]}</span>
        <p className="mt-[0.43rem] text-[0.88rem] font-bold leading-[1.48] text-[var(--issa-text)]">{content.title}</p>
        {content.detail && (
          change.type === 'feedback'
            ? <blockquote className="recent-feedback-quote mt-[0.42rem] overflow-hidden font-serif text-[0.78rem] italic leading-[1.5] text-[#695d3d] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{content.detail}</blockquote>
            : <span className="mt-[0.3rem] inline-block text-[0.72rem] font-bold text-[#786d53]">{content.detail}</span>
        )}
        {content.context && (
          <span className="mt-[0.42rem] block max-w-[42rem] border-l-2 border-[#c8bfa8] pl-[0.55rem] text-[0.7rem] leading-[1.5] text-[#756c57]">
            {content.context}
          </span>
        )}
      </div>
      <time className="justify-self-end pt-[0.24rem] text-right text-[0.72rem] font-bold text-[#81775e] max-[639px]:col-start-3 max-[639px]:row-start-1 max-[639px]:ml-[6.4rem] max-[639px]:justify-self-start max-[639px]:pt-[0.12rem] max-[399px]:row-auto max-[399px]:ml-0" dateTime={change.occurredAt || undefined}>
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
    <section
        className="relative overflow-hidden rounded-[0.9rem_2.3rem_0.9rem_0.9rem] border border-[#d7cba9] bg-[#fffdf5] min-[900px]:col-span-2"
        style={{ boxShadow: '0.46rem 0.5rem 0 rgba(125, 101, 47, 0.09)' }}
      aria-labelledby="recent-student-changes-title"
      aria-busy={status === 'loading'}
    >
      <header
        className="relative z-[1] border-b border-[#ddd2b6] px-[1.35rem] pb-[1.05rem] pt-5 max-[639px]:p-[1.1rem] max-[399px]:p-4"
        style={{ backgroundImage: 'linear-gradient(90deg, rgba(255, 247, 214, 0.76), rgba(255, 253, 245, 0.76) 62%)' }}
      >
        <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Student insights</p>
        <h2 className="mt-[0.24rem] text-[1.28rem] [font-weight:850] tracking-[-0.025em] text-[var(--issa-text)]" id="recent-student-changes-title">Perubahan terbaru</h2>
        <p className="mt-[0.35rem] max-w-[44rem] text-[0.86rem] leading-[1.55] text-[var(--issa-text-secondary)]">
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
          <dl className="relative z-[1] m-0 grid grid-cols-2 border-b border-[#ddd2b6] bg-[rgba(255,253,245,0.84)] max-[639px]:grid-cols-1">
            <div className="grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.8rem] px-[1.35rem] py-[0.9rem] max-[639px]:min-h-[3.9rem] max-[639px]:px-[1.1rem] max-[639px]:py-[0.75rem] max-[399px]:px-4">
              <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-[#7c704f]">Kehadiran 30 hari</dt>
              <dd className="m-0 text-[1.12rem] [font-weight:850] text-[#4d4430]">{attendanceRateLabel}</dd>
            </div>
            <div className="grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.8rem] border-l border-[#ddd2b6] px-[1.35rem] py-[0.9rem] max-[639px]:min-h-[3.9rem] max-[639px]:border-l-0 max-[639px]:border-t max-[639px]:px-[1.1rem] max-[639px]:py-[0.75rem] max-[399px]:px-4">
              <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-[#7c704f]">Interpretasi sistem · tren nilai</dt>
              <dd className="m-0 text-[1.12rem] [font-weight:850] text-[#4d4430]">{academicTrendLabel}</dd>
            </div>
          </dl>

          {recentChanges.length === 0 ? (
            <RecentChangesMessage
              tone="empty"
              title="Belum ada perubahan terbaru untuk ditampilkan."
              description="Catatan kehadiran, pengukuran akademik, dan observasi guru baru akan muncul di sini."
            />
          ) : (
            <ol className="recent-student-changes__timeline relative z-[1] m-0 max-h-[26rem] list-none overflow-y-auto bg-[rgba(255,253,245,0.7)] p-0 overscroll-contain max-[639px]:max-h-[31rem]">
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
  );
}
