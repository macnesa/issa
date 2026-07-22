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
    <section className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-heading">Kehadiran Hari Ini</h2>
          <p className="mt-1 text-sm text-[var(--issa-text-secondary)]">{message}</p>
        </div>
        <span className={`status-badge ${modifier}`}>{status}</span>
      </div>
    </section>
  );
}
