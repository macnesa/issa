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
    <main className="page-container attendance-page">
      <section className="editorial-page-heading">
        <h1 className="page-title">Kehadiran</h1>
        <p className="page-supporting-text mt-1">Histori dan ringkasan kehadiran siswa.</p>
      </section>

      <section className="attendance-today">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="overview-kicker">Hari ini</p><h2>Kehadiran</h2>
            <p>{todayAttendance ? 'Kehadiran hari ini sudah tercatat.' : 'Belum ada catatan kehadiran hari ini.'}</p>
          </div>
          <span className={`status-badge ${statusModifiers[todayAttendance?.status] || 'status-badge--neutral'}`}>{todayAttendance?.status || 'Belum tercatat'}</span>
        </div>
      </section>

      <section className="attendance-summary">
        <div><p className="overview-kicker">Rekam rutin</p><h2>Ringkasan Kehadiran</h2></div>
        <dl className="attendance-summary__grid">
          {statuses.map((status) => (
            <div key={status} className={`attendance-summary__metric attendance-summary__metric--${status.toLowerCase()}`}>
              <dt>{status}</dt><dd>{counts[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="attendance-history">
        <p className="overview-kicker">Rekam kehadiran</p><h2>Histori Kehadiran</h2>
        {!history.length ? (
          <EmptyState message="Belum ada kehadiran yang tercatat." />
        ) : (
          <div className="mt-4 space-y-5">
            {history.map((group) => (
              <div key={group.key} className="attendance-history__month">
                <h3>{group.label}</h3>
                <ul>
                  {group.records.map((record) => (
                    <li key={record.id ?? `${record.createdAt}-${record.status}`}>
                      <time>{formatAttendanceDate(record.createdAt)}</time>
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
        <section className="attendance-heatmap">
          <p className="overview-kicker">Visual pendukung</p><h2>Visual Kehadiran</h2>
          <p>Visual pendukung histori kehadiran.</p>
          <div className="attendance-heatmap__chart">
            <HeatmapDua data={attendance} />
          </div>
        </section>
      )}

      {loaded && !attendance.length && <span className="sr-only">Attendance data is empty.</span>}
    </main>
  );
}
