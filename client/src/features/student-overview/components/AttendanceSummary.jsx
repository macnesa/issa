import { Link } from 'react-router-dom';
import { SectionHeader, Surface } from '../../../shared/ui/ui';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

export default function AttendanceSummary({ counts }) {
  return (
    <Surface aqua>
      <SectionHeader
        kicker="Rekam rutin"
        title="Ringkasan Kehadiran"
        action={<Link to="/attendance" className="text-link">Lihat riwayat</Link>}
      />
      <dl className="metric-grid">
        {statuses.map((status) => (
          <div key={status} className="metric-card">
            <dt className="metric-label">{status}</dt>
            <dd className="metric-value">{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </Surface>
  );
}
