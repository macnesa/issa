import { Link } from 'react-router-dom';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

export default function AttendanceSummary({ counts }) {
  return (
    <section className="overview-attendance-summary relative overflow-hidden p-[1.35rem]">
      <div className="flex items-center justify-between gap-4">
        <div><p className="overview-kicker">Rekam rutin</p><h2>Ringkasan Kehadiran</h2></div>
        <Link to="/attendance" className="text-link">Lihat riwayat</Link>
      </div>
      <dl className="overview-attendance-summary__grid mt-4 grid grid-cols-2 gap-[0.7rem]">
        {statuses.map((status) => (
          <div key={status} className={`overview-attendance-summary__metric min-h-20 p-[0.8rem] overview-attendance-summary__metric--${status.toLowerCase()}`}>
            <dt>{status}</dt>
            <dd>{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
