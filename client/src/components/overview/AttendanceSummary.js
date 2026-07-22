import { Link } from 'react-router-dom';

const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

export default function AttendanceSummary({ counts }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-heading">Ringkasan Kehadiran</h2>
        <Link to="/attendance" className="text-link">Lihat riwayat</Link>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statuses.map((status) => (
          <div key={status} className="metric-card">
            <dt className="metric-label">{status}</dt>
            <dd className="metric-value">{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
