import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import HeatmapDua from '../features/attendance/components/HeatmapChartDua';
import { fetchStudentOverview } from '../store/actions/actionCreator';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ResourceStates';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Surface,
} from '../shared/ui/ui';
import {
  calculateAttendanceSummary,
  getTodayAttendance,
  groupAttendanceHistoryByMonth,
} from '../features/student-overview/helpers';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

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

  if (loading) return <PageContainer><LoadingState label="Memuat kehadiran..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} /></PageContainer>;

  return (
    <PageContainer className="page-grid page-grid--split">
      <PageHeader
        title="Kehadiran"
        description="Histori dan ringkasan kehadiran siswa."
        wide
      />

      <Surface className="surface--full attendance-today" aqua offset>
        <div>
          <p className="section-kicker">Hari ini</p>
          <h2 className="section-heading">Kehadiran</h2>
          <p className="page-supporting-text">
            {todayAttendance
              ? 'Kehadiran hari ini sudah tercatat.'
              : 'Belum ada catatan kehadiran hari ini.'}
          </p>
        </div>
        <StatusBadge status={todayAttendance?.status} />
      </Surface>

      <Surface aqua>
        <SectionHeader kicker="Rekam rutin" title="Ringkasan Kehadiran" />
        <dl className="metric-grid">
          {statuses.map((status) => (
            <div key={status} className="metric-card">
              <dt className="metric-label">{status}</dt>
              <dd className="metric-value">{attendanceSummary[status]}</dd>
            </div>
          ))}
        </dl>
      </Surface>

      <Surface>
        <SectionHeader kicker="Rekam kehadiran" title="Histori Kehadiran" />
        {!attendanceHistoryByMonth.length ? (
          <EmptyState message="Belum ada kehadiran yang tercatat." />
        ) : (
          <div className="attendance-history">
            {attendanceHistoryByMonth.map((attendanceMonth) => (
              <section key={attendanceMonth.key}>
                <h3>{attendanceMonth.label}</h3>
                <ul className="history-list">
                  {attendanceMonth.records.map((attendanceRecord) => (
                    <li
                      className="history-record"
                      key={attendanceRecord.id ?? `${attendanceRecord.createdAt}-${attendanceRecord.status}`}
                    >
                      <time>{formatAttendanceDate(attendanceRecord.createdAt)}</time>
                      <StatusBadge status={attendanceRecord.status}>
                        {attendanceRecord.status || 'Status belum tersedia'}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Surface>

      {!!attendance.length && (
        <Surface className="surface--full">
          <SectionHeader
            kicker="Visual pendukung"
            title="Visual Kehadiran"
            description="Visual pendukung histori kehadiran."
          />
          <div className="attendance-heatmap">
            <HeatmapDua data={attendance} />
          </div>
        </Surface>
      )}

      {loaded && !attendance.length && <span className="sr-only">Attendance data is empty.</span>}
    </PageContainer>
  );
}
