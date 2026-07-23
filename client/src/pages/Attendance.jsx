import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import HeatmapDua from '../features/attendance/components/HeatmapChartDua';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import { calculateAttendanceSummary, getTodayAttendance, groupAttendanceHistoryByMonth } from '../features/student-overview/helpers';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];
const statusModifiers = {
  Hadir: 'status-badge--hadir',
  Sakit: 'status-badge--sakit',
  Izin: 'status-badge--izin',
  Alfa: 'status-badge--alfa',
};

function formatAttendanceDate(attendanceDate) {
  const date = new Date(attendanceDate);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AttendancePage() {
  const dispatch = useDispatch();
  const { studentDetail: attendanceResource } = useSelector((state) => state.student);
  const { data: studentDetail, loading, loaded, error } = attendanceResource;
  const { attendance } = studentDetail;
  const todayAttendance = useMemo(() => getTodayAttendance(attendance), [attendance]);
  const attendanceSummary = useMemo(() => calculateAttendanceSummary(attendance), [attendance]);
  const attendanceHistoryByMonth = useMemo(() => groupAttendanceHistoryByMonth(attendance), [attendance]);

  if (loading) return <main className="page-container"><LoadingState label="Memuat kehadiran..." /></main>;
  if (error) return <main className="page-container"><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></main>;

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
            <dt>{status}</dt><dd>{attendanceSummary[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="attendance-history">
        <p className="overview-kicker">Rekam kehadiran</p><h2>Histori Kehadiran</h2>
        {!attendanceHistoryByMonth.length ? (
          <EmptyState message="Belum ada kehadiran yang tercatat." />
        ) : (
          <div className="mt-4 space-y-5">
            {attendanceHistoryByMonth.map((attendanceMonth) => (
              <div key={attendanceMonth.key} className="attendance-history__month">
                <h3>{attendanceMonth.label}</h3>
                <ul>
                  {attendanceMonth.records.map((attendanceRecord) => (
                    <li key={attendanceRecord.id ?? `${attendanceRecord.createdAt}-${attendanceRecord.status}`}>
                      <time>{formatAttendanceDate(attendanceRecord.createdAt)}</time>
                      <span className={`status-badge ${statusModifiers[attendanceRecord.status] || 'status-badge--neutral'}`}>{attendanceRecord.status || 'Status belum tersedia'}</span>
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
