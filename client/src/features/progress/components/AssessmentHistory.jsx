import { HistoryRecord, SectionHeader, Surface } from '../../../shared/ui/ui';

function formatScoreRecordedDate(recordedAt) {
  if (!recordedAt) return 'Tanggal pencatatan belum tersedia';
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return 'Tanggal pencatatan belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AssessmentHistory({ records, className = '' }) {
  return (
    <Surface className={className}>
      <SectionHeader kicker="Rekam penilaian" title="Histori Assessment" />
      <ul className="history-list">
        {records.map((scoreRecord) => (
          <HistoryRecord
            key={scoreRecord.id ?? `${scoreRecord.assignmentId}-${scoreRecord.recordedAt}`}
            title={scoreRecord.assignment?.description || 'Assessment tanpa deskripsi'}
            meta={`${scoreRecord.category || 'Kategori belum tersedia'} · ${formatScoreRecordedDate(scoreRecord.recordedAt)}`}
            value={scoreRecord.value}
          />
        ))}
      </ul>
    </Surface>
  );
}
