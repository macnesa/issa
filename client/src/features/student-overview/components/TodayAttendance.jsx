export default function TodayAttendance({ attendance }) {
  const status = attendance?.status || 'Belum tercatat';
  const statusModifiers = {
    Hadir: 'status-badge--hadir',
    Sakit: 'status-badge--sakit',
    Izin: 'status-badge--izin',
    Alfa: 'status-badge--alfa',
  };
  const modifier = statusModifiers[attendance?.status] || 'status-badge--neutral';
  const message = attendance
    ? 'Kehadiran hari ini sudah tercatat.'
    : 'Belum ada catatan kehadiran hari ini.';

  return (
    <section
      className="flex items-center justify-between gap-4 rounded-[1.1rem_0.65rem_1.1rem_0.65rem] bg-[#f2e291] px-[1.35rem] py-[1.2rem] min-[900px]:relative min-[900px]:min-h-[7.2rem] min-[900px]:overflow-hidden min-[900px]:px-[1.6rem] min-[900px]:py-[1.25rem]"
      style={{ boxShadow: '0.45rem 0.45rem 0 #e2ce73' }}
    >
      <div>
        <div>
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)] min-[900px]:text-[#79682d]">Hari ini</p>
          <h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)] min-[900px]:text-[1.35rem]">Kehadiran</h2>
          <p className="mt-[0.35rem] text-[0.88rem] text-[#695d2a]">{message}</p>
        </div>
      </div>
      <span className={`status-badge shrink-0 border border-[rgba(23,33,43,0.12)] !bg-white/70 min-[900px]:min-w-[7.1rem] min-[900px]:justify-center min-[900px]:px-[0.8rem] min-[900px]:py-[0.48rem] min-[900px]:shadow-[0.2rem_0.22rem_0_rgba(105,93,42,0.12)] ${modifier}`}>{status}</span>
    </section>
  );
}
