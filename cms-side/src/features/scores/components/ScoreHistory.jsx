import { LedgerShell } from "../../../shared/ui/ui";
import TableScores from "./TableScores";

export default function ScoreHistory({ scores, student }) {
  const scoreRecords = Array.isArray(scores) ? scores : [];
  const showPredikat = scoreRecords.some((score) => Boolean(score.category));

  return (
    <LedgerShell
      className="score-history-ledger"
      eyebrow="Rekam akademik"
      title="Riwayat nilai"
      description="Status ditentukan berdasarkan KKM mata pelajaran."
      overflow={scoreRecords.length > 0}
      empty={scoreRecords.length === 0}
      emptyTitle="Belum ada nilai tercatat"
      emptyDescription="Catat penilaian pertama untuk membuka riwayat akademik siswa."
    >
      {scoreRecords.length > 0 && (
          <table className="score-history-ledger__table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Mata pelajaran</th>
                <th>Penilaian</th>
                <th>KKM</th>
                <th>Nilai</th>
                <th>Status</th>
                {showPredikat && <th>Predikat</th>}
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scoreRecords.map((score, index) => (
                <TableScores
                  key={score.id}
                  data={score}
                  student={student}
                  recordIndex={index + 1}
                  showPredikat={showPredikat}
                />
              ))}
            </tbody>
          </table>
      )}
    </LedgerShell>
  );
}
