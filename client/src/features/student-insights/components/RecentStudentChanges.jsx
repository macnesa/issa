import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../../config/apiClient';
import normalizeApiError from '../../../utils/normalizeApiError';
import './RecentStudentChanges.css';

const academicTrendLabels = {
  improving: 'Meningkat',
  declining: 'Menurun',
  stable: 'Stabil',
  insufficient_data: 'Belum cukup data',
};

const domainLabels = {
  score: 'Nilai',
  attendance: 'Kehadiran',
  feedback: 'Feedback guru',
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
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : '—';
}

function getScoreChangeCopy(change) {
  const lessonName = change.lessonName || 'pelajaran';
  const currentValue = formatScoreValue(change.value);
  const previousValue = formatScoreValue(change.previousValue);

  if (change.direction === 'improved') {
    return `Nilai ${lessonName} meningkat dari ${previousValue} menjadi ${currentValue}.`;
  }
  if (change.direction === 'declined') {
    return `Nilai ${lessonName} turun dari ${previousValue} menjadi ${currentValue}.`;
  }
  if (change.direction === 'unchanged') {
    return `Nilai ${lessonName} tetap di ${currentValue}.`;
  }
  if (change.direction === 'first_record') {
    return `Nilai pertama ${lessonName} tercatat ${currentValue}.`;
  }

  return `Nilai ${lessonName} tercatat ${currentValue}.`;
}

function getChangeContent(change) {
  if (change.type === 'score') {
    return {
      title: getScoreChangeCopy(change),
      detail: `KKM ${formatScoreValue(change.kkm)}`,
    };
  }

  if (change.type === 'attendance') {
    return {
      title: `Kehadiran tercatat sebagai ${change.status}.`,
      detail: null,
    };
  }

  if (change.type === 'feedback') {
    return {
      title: 'Guru menambahkan catatan perkembangan baru.',
      detail: change.content || null,
    };
  }

  return {
    title: 'Catatan perkembangan baru tersedia.',
    detail: null,
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
      </div>
      <time dateTime={change.occurredAt || undefined}>
        {formatRecordDate(change.occurredAt)}
      </time>
    </li>
  );
}

export default function RecentStudentChanges({ studentId }) {
  const [status, setStatus] = useState(studentId ? 'loading' : 'success');
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const requestedStudentId = useRef(null);

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
    if (!studentId || requestedStudentId.current === studentId) return;
    requestedStudentId.current = studentId;
    loadStudentInsights();
  }, [loadStudentInsights, studentId]);

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
      className="recent-student-changes"
      aria-labelledby="recent-student-changes-title"
      aria-busy={status === 'loading'}
    >
      <header className="recent-student-changes__header">
        <p className="overview-kicker">Student insights</p>
        <h2 id="recent-student-changes-title">Perubahan terbaru</h2>
        <p>Ringkasan perubahan dari catatan kehadiran, nilai, dan feedback guru.</p>
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
              <dt>Tren akademik</dt>
              <dd>{academicTrendLabel}</dd>
            </div>
          </dl>

          {recentChanges.length === 0 ? (
            <RecentChangesMessage
              tone="empty"
              title="Belum ada perubahan terbaru untuk ditampilkan."
              description="Catatan kehadiran, nilai, dan feedback baru akan muncul di sini."
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
  );
}
