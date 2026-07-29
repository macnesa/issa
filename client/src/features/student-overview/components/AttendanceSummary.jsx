import { Link } from 'react-router-dom';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];
const metricColors = {
  Hadir: 'var(--issa-success)',
  Sakit: 'var(--issa-info)',
  Izin: 'var(--issa-warning)',
  Alfa: 'var(--issa-danger)',
};

export default function AttendanceSummary({ counts }) {
  return (
    <section className="relative overflow-hidden rounded-[1.1rem_1.1rem_1.1rem_2.75rem] border border-[#cfe4ec] bg-[#eaf6f8] p-[1.35rem] max-[399px]:p-[1.15rem] min-[900px]:min-h-[18.15rem] min-[900px]:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative z-[1]"><p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Rekam rutin</p><h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)]">Ringkasan Kehadiran</h2></div>
        <Link to="/attendance" className="text-link">Lihat riwayat</Link>
      </div>
      <dl className="relative z-[1] mt-4 grid grid-cols-2 gap-[0.7rem] min-[900px]:min-h-[12.1rem] min-[900px]:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] min-[900px]:grid-rows-3 min-[900px]:gap-x-[0.72rem] min-[900px]:gap-y-[0.58rem] min-[900px]:mt-[1.1rem]">
        {statuses.map((status) => (
          <div
            key={status}
            className={`min-h-20 rounded-[1rem_0.55rem_1rem_0.55rem] border-b-[0.22rem] bg-white/80 p-[0.8rem] min-[900px]:relative min-[900px]:z-[1] min-[900px]:flex min-[900px]:min-h-0 min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-4 min-[900px]:rounded-[0.82rem_0.42rem_0.82rem_0.42rem] min-[900px]:px-[0.85rem] min-[900px]:py-[0.72rem] ${status === 'Hadir' ? 'overview-attendance-highlight' : 'min-[900px]:border-l-[0.18rem]'}`}
            style={{
              borderBottomColor: metricColors[status],
              borderLeftColor: status === 'Hadir' ? undefined : metricColors[status],
            }}
          >
            <dt className={`text-[0.78rem] font-bold text-[var(--issa-text-secondary)] ${status === 'Hadir' ? 'min-[900px]:text-[0.88rem] min-[900px]:text-[#286d4d]' : ''}`}>{status}</dt>
            <dd className={`mt-[0.15rem] text-[1.55rem] font-extrabold leading-none text-[var(--issa-text)] min-[900px]:m-0 ${status === 'Hadir' ? 'min-[900px]:mt-1 min-[900px]:text-[clamp(3.35rem,5vw,4.6rem)] min-[900px]:tracking-[-0.065em] min-[900px]:text-[#1d5239]' : ''}`}>{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
