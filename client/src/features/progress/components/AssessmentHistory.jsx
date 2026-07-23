function formatScoreRecordedDate(recordedAt) {
  if (!recordedAt) return 'Tanggal pencatatan belum tersedia';

  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return 'Tanggal pencatatan belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AssessmentHistory({ records }) {
  return (
    <section className="assessment-history">
      <p className="overview-kicker">Rekam penilaian</p><h2>Histori Assessment</h2>
      <ul>
        {records.map((scoreRecord) => (
          <li key={scoreRecord.id ?? `${scoreRecord.assignmentId}-${scoreRecord.recordedAt}`}>
            <div>
              <div>
                <p>{scoreRecord.assignment?.description || 'Assessment tanpa deskripsi'}</p>
                <p>{scoreRecord.category || 'Kategori belum tersedia'}</p>
                <time>{formatScoreRecordedDate(scoreRecord.recordedAt)}</time>
              </div>
              <span>{scoreRecord.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
