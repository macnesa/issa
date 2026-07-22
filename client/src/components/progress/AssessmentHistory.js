function formatRecordedAt(value) {
  if (!value) return 'Tanggal pencatatan belum tersedia';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal pencatatan belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AssessmentHistory({ records }) {
  return (
    <section className="surface p-5">
      <h2 className="section-heading">Histori Assessment</h2>
      <ul className="mt-3 divide-y divide-[var(--issa-border)]">
        {records.map((record) => (
          <li key={record.id ?? `${record.assignmentId}-${record.recordedAt}`} className="py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--issa-text)]">{record.assignment?.description || 'Assessment tanpa deskripsi'}</p>
                <p className="mt-1 text-xs text-[var(--issa-text-secondary)]">{record.category || 'Kategori belum tersedia'}</p>
                <time className="mt-1 block text-xs text-[var(--issa-text-muted)]">{formatRecordedAt(record.recordedAt)}</time>
              </div>
              <span className="text-lg font-bold text-[var(--issa-text)]">{record.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
