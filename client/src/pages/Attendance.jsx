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
const summaryBorderColors = {
  Hadir: 'var(--issa-success)',
  Sakit: 'var(--issa-info)',
  Izin: 'var(--issa-warning)',
  Alfa: 'var(--issa-danger)',
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
    <main className="page-container grid items-start gap-5 sm:gap-6 min-[900px]:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
      <section className="relative pt-2 pb-[0.55rem] min-[900px]:col-span-2">
        <h1 className="page-title text-[clamp(1.7rem,5vw,2.25rem)]">Kehadiran</h1>
        <p className="page-supporting-text mt-1">Histori dan ringkasan kehadiran siswa.</p>
      </section>

      <section
        className="rounded-[1.1rem_0.65rem_1.1rem_0.65rem] bg-[#f2e291] px-[1.35rem] py-[1.2rem] min-[900px]:col-span-2"
        style={{ boxShadow: '0.42rem 0.42rem 0 #e2ce73' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Hari ini</p>
            <h2 className="mt-1 text-[1.3rem] [font-weight:850] tracking-[-0.025em] text-[var(--issa-text)]">Kehadiran</h2>
            <p className="mt-[0.35rem] text-[0.9rem] text-[#695d2a]">{todayAttendance ? 'Kehadiran hari ini sudah tercatat.' : 'Belum ada catatan kehadiran hari ini.'}</p>
          </div>
          <span className={`status-badge shrink-0 border border-[rgba(23,33,43,0.12)] !bg-white/70 ${statusModifiers[todayAttendance?.status] || 'status-badge--neutral'}`}>{todayAttendance?.status || 'Belum tercatat'}</span>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.1rem_1.1rem_1.1rem_2.75rem] border border-[#cfe4ec] bg-[#eaf6f8] p-[1.35rem]">
        <div className="relative z-[1]">
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Rekam rutin</p>
          <h2 className="mt-1 text-xl [font-weight:850]">Ringkasan Kehadiran</h2>
        </div>
        <dl className="relative z-[1] mt-4 grid grid-cols-2 gap-[0.7rem]">
          {statuses.map((status) => (
            <div
              key={status}
              className="min-h-[5.1rem] rounded-[0.95rem_0.52rem_0.95rem_0.52rem] border-b-[0.22rem] bg-white/80 p-[0.8rem]"
              style={{ borderBottomColor: summaryBorderColors[status] }}
            >
            <dt className="text-[0.8rem] font-bold text-[var(--issa-text-secondary)]">{status}</dt>
            <dd className="mt-[0.15rem] text-[1.6rem] [font-weight:850] leading-none text-[var(--issa-text)]">{attendanceSummary[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[0.85rem_2.25rem_0.85rem_0.85rem] border border-[#d8e2e7] bg-white p-[1.35rem]">
        <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Rekam kehadiran</p>
        <h2 className="mt-1 text-xl [font-weight:850]">Histori Kehadiran</h2>
        {!attendanceHistoryByMonth.length ? (
          <EmptyState message="Belum ada kehadiran yang tercatat." />
        ) : (
          <div className="mt-4 space-y-5">
            {attendanceHistoryByMonth.map((attendanceMonth) => (
              <div key={attendanceMonth.key} className="mt-[1.15rem]">
                <h3 className="m-0 inline-block rounded-[0.7rem_0.35rem_0.7rem_0.35rem] bg-[#eaf6f8] px-[0.7rem] py-[0.3rem] text-[0.82rem] font-extrabold text-[#315f62]">{attendanceMonth.label}</h3>
                <ul className="mt-[0.6rem] list-none border-l-2 border-[#c9e8e7] py-0 pl-4">
                  {attendanceMonth.records.map((attendanceRecord) => (
                    <li className="flex items-center justify-between gap-4 py-[0.7rem] text-[0.9rem] text-[var(--issa-text-secondary)]" key={attendanceRecord.id ?? `${attendanceRecord.createdAt}-${attendanceRecord.status}`}>
                      <span
                        className="-ml-[1.28rem] h-[0.48rem] w-[0.48rem] shrink-0 rounded-full bg-[#6bbfbc]"
                        style={{ boxShadow: '0 0 0 0.18rem #eaf6f8' }}
                        aria-hidden="true"
                      />
                      <time className="flex-1">{formatAttendanceDate(attendanceRecord.createdAt)}</time>
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
        <section className="overflow-hidden rounded-[0.85rem] border border-[#d5ecec] bg-[#f8ffff] p-[1.35rem] min-[900px]:col-span-2">
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Visual pendukung</p>
          <h2 className="mt-1 text-[1.2rem] [font-weight:850]">Visual Kehadiran</h2>
          <p className="mt-[0.35rem] text-[0.88rem] text-[var(--issa-text-secondary)]">Visual pendukung histori kehadiran.</p>
          <div className="mt-4 overflow-hidden rounded-[0.7rem] bg-white/80 p-2">
            <HeatmapDua data={attendance} />
          </div>
        </section>
      )}

      {loaded && !attendance.length && <span className="sr-only">Attendance data is empty.</span>}
    </main>
  );
}
