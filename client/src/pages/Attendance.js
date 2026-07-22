import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import HeatmapDua from '../components/HeatmapChartDua';
import { fetchStudentDetail } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../components/runtime/ResourceStates';
import { getAttendanceCounts, getAttendanceHistory, getTodayAttendance } from '../utils/studentOverview';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];
const statusModifiers = {
  Hadir: 'status-badge--hadir',
  Sakit: 'status-badge--sakit',
  Izin: 'status-badge--izin',
  Alfa: 'status-badge--alfa',
};

function formatAttendanceDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AttendancePage() {
  const dispatch = useDispatch();
  const { studentDetail: attendanceResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = attendanceResource;
  const { attendance } = studentDetail;
  const todayAttendance = useMemo(() => getTodayAttendance(attendance), [attendance]);
  const counts = useMemo(() => getAttendanceCounts(attendance), [attendance]);
  const history = useMemo(() => getAttendanceHistory(attendance), [attendance]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat kehadiran..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentDetail())} /></main>;

  return (
    <main className="page-container space-y-4">
      <section>
        <h1 className="page-title">Kehadiran</h1>
        <p className="page-supporting-text mt-1">Histori dan ringkasan kehadiran siswa.</p>
      </section>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-heading">Kehadiran Hari Ini</h2>
            <p className="page-supporting-text mt-1">{todayAttendance ? 'Kehadiran hari ini sudah tercatat.' : 'Belum ada catatan kehadiran hari ini.'}</p>
          </div>
          <span className={`status-badge ${statusModifiers[todayAttendance?.status] || 'status-badge--neutral'}`}>{todayAttendance?.status || 'Belum tercatat'}</span>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="section-heading">Ringkasan Kehadiran</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statuses.map((status) => (
            <div key={status} className="metric-card">
              <dt className="metric-label">{status}</dt>
              <dd className="metric-value">{counts[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="section-heading">Histori Kehadiran</h2>
        {!history.length ? (
          <EmptyState message="Belum ada kehadiran yang tercatat." />
        ) : (
          <div className="mt-4 space-y-5">
            {history.map((group) => (
              <div key={group.key}>
                <h3 className="text-sm font-semibold text-[var(--issa-text-secondary)]">{group.label}</h3>
                <ul className="mt-2 divide-y divide-[var(--issa-border)]">
                  {group.records.map((record) => (
                    <li key={record.id ?? `${record.createdAt}-${record.status}`} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <time className="text-[var(--issa-text-secondary)]">{formatAttendanceDate(record.createdAt)}</time>
                      <span className={`status-badge ${statusModifiers[record.status] || 'status-badge--neutral'}`}>{record.status || 'Status belum tersedia'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {!!attendance.length && (
        <section className="surface p-5">
          <h2 className="section-heading">Visual Kehadiran</h2>
          <p className="page-supporting-text mt-1">Visual pendukung histori kehadiran.</p>
          <div className="mt-4 overflow-x-auto rounded-[var(--issa-radius-sm)] bg-[var(--issa-surface-soft)] p-3">
            <HeatmapDua data={attendance} />
          </div>
        </section>
      )}

      {loaded && !attendance.length && <span className="sr-only">Attendance data is empty.</span>}
    </main>
  );
}
