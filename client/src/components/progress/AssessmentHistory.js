function formatRecordedAt(value) {
  if (!value) return 'Tanggal pencatatan belum tersedia';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal pencatatan belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AssessmentHistory({ records }) {
  return (
    <section className="assessment-history">
      <p className="overview-kicker">Rekam penilaian</p><h2>Histori Assessment</h2>
      <ul>
        {records.map((record) => (
          <li key={record.id ?? `${record.assignmentId}-${record.recordedAt}`}>
            <div>
              <div>
                <p>{record.assignment?.description || 'Assessment tanpa deskripsi'}</p>
                <p>{record.category || 'Kategori belum tersedia'}</p>
                <time>{formatRecordedAt(record.recordedAt)}</time>
              </div>
              <span>{record.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
