function formatScoreRecordedDate(recordedAt) {
  if (!recordedAt) return 'Tanggal pencatatan belum tersedia';

  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return 'Tanggal pencatatan belum tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AssessmentHistory({ records, className = '' }) {
  return (
    <section className={`min-w-0 rounded-[2.2rem_0.85rem_0.85rem] border border-[#e2d9ef] bg-white p-[1.35rem] ${className}`}>
      <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Rekam penilaian</p>
      <h2 className="mt-1 text-[1.3rem] [font-weight:850]">Histori Assessment</h2>
      <ul className="mt-4 grid list-none gap-[0.7rem] p-0">
        {records.map((scoreRecord) => (
          <li className="rounded-r-[0.7rem] border-l-4 border-[#9555c2] bg-[#faf8ff] p-[0.9rem]" key={scoreRecord.id ?? `${scoreRecord.assignmentId}-${scoreRecord.recordedAt}`}>
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 break-words text-[0.92rem] font-extrabold text-[#4d315e]">{scoreRecord.assignment?.description || 'Assessment tanpa deskripsi'}</p>
                <p className="mt-[0.26rem] break-words text-[0.78rem] font-bold text-[#806694]">{scoreRecord.category || 'Kategori belum tersedia'}</p>
                <time className="mt-[0.3rem] block text-[0.76rem] text-[#917e9e]">{formatScoreRecordedDate(scoreRecord.recordedAt)}</time>
              </div>
              <span className="shrink-0 text-[1.35rem] [font-weight:850] text-[#684087]">{scoreRecord.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
