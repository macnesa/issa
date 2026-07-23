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
    <section className="overview-today-attendance">
      <div>
        <div>
          <p className="overview-kicker">Hari ini</p>
          <h2>Kehadiran</h2>
          <p>{message}</p>
        </div>
      </div>
      <span className={`status-badge ${modifier}`}>{status}</span>
    </section>
  );
}
