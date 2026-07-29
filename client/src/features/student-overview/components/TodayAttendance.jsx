import { StatusBadge, Surface } from '../../../shared/ui/ui';

export default function TodayAttendance({ attendance }) {
  const status = attendance?.status || 'Belum tercatat';
  const message = attendance
    ? 'Kehadiran hari ini sudah tercatat.'
    : 'Belum ada catatan kehadiran hari ini.';

  return (
    <Surface className="overview-today" aqua offset>
      <div>
        <p className="section-kicker">Hari ini</p>
        <h2 className="section-heading">Kehadiran</h2>
        <p className="page-supporting-text">{message}</p>
      </div>
      <StatusBadge status={attendance?.status}>{status}</StatusBadge>
    </Surface>
  );
}
