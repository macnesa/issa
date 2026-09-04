import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import { getTodayAttendance } from '../features/student-overview/helpers';
import { formatParentDate } from '../features/parent-journey/parentJourney';
import { parseParentDate } from '../utils/parentDates';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

export function recordsInLastDays(records, days, now = new Date()) {
  const lowerBound = new Date(now);
  lowerBound.setHours(23, 59, 59, 999);
  lowerBound.setDate(lowerBound.getDate() - (days - 1));
  lowerBound.setHours(0, 0, 0, 0);
  return records.filter((record) => {
    const date = parseParentDate(record.createdAt);
    return !Number.isNaN(date.getTime()) && date >= lowerBound && date <= now;
  });
}

export default function AttendancePage() {
  const dispatch = useDispatch();
  const resource = useSelector((state) => state.student.studentDetail);
  const { data: studentDetail, loading, error } = resource;
  const attendance = studentDetail.attendance;
  const todayAttendance = useMemo(() => getTodayAttendance(attendance), [attendance]);
  const last30Days = useMemo(() => recordsInLastDays(attendance, 30), [attendance]);
  const last30Counts = useMemo(() => last30Days.reduce((result, record) => {
    if (statuses.includes(record.status)) result[record.status] += 1;
    return result;
  }, { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 }), [last30Days]);
  const history = useMemo(() => attendance.slice().sort((left, right) => {
    const rightTime = new Date(right.createdAt).getTime();
    const leftTime = new Date(left.createdAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), [attendance]);

  if (loading) return <main id="parent-main-content" tabIndex={-1} className="page-container"><LoadingState label="Memuat kehadiran..." /></main>;
  if (error) return <main id="parent-main-content" tabIndex={-1} className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

  return (
    <main id="parent-main-content" tabIndex={-1} className="page-container parent-new-page parent-attendance-detail">
      <StudentIdentity profile={studentDetail.profile} compact />
      <header className="parent-new-heading">
        <span>Detail · Kehadiran</span>
        <h1>Riwayat kehadiran.</h1>
        <p>Ringkasan di bawah hanya mencakup 30 hari terakhir. Histori menampilkan semua catatan yang tersedia dari sekolah.</p>
        <Link className="parent-inline-link" to="/journey">Kembali ke Perjalanan</Link>
      </header>

      <section className="parent-attendance-now">
        <span>Hari ini</span>
        <strong>{todayAttendance?.status || 'Belum tercatat'}</strong>
      </section>

      <section className="parent-attendance-period" aria-labelledby="attendance-30-heading">
        <div className="parent-section-title">
          <span>30 hari terakhir</span>
          <h2 id="attendance-30-heading">Kehadiran tercatat</h2>
        </div>
        <dl>
          {statuses.map((status) => (
            <div key={status}>
              <dt>{status}</dt>
              <dd>{last30Counts[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="parent-attendance-history" aria-labelledby="attendance-history-heading">
        <div className="parent-section-title">
          <span>Histori tersedia</span>
          <h2 id="attendance-history-heading">Catatan per hari</h2>
        </div>
        {!history.length ? (
          <EmptyState message="Belum ada catatan kehadiran yang tersedia." />
        ) : (
          <ol>
            {history.map((record) => (
              <li key={record.id ?? record.createdAt}>
                <time>{formatParentDate(record.createdAt)}</time>
                <strong>{record.status || 'Belum tercatat'}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
