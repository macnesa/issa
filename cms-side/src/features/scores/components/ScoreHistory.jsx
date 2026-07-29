import { Surface } from "../../../shared/ui/ui";
import TableScores from "./TableScores";

export default function ScoreHistory({ scores, student }) {
  const scoreRecords = Array.isArray(scores) ? scores : [];
  const showPredikat = scoreRecords.some((score) => Boolean(score.category));

  return (
    <Surface className="score-history-ledger">
      <div className="score-history-ledger__header">
        <p>Rekam akademik</p>
        <h2>Riwayat nilai</h2>
        <span>Status ditentukan berdasarkan KKM mata pelajaran.</span>
      </div>
      {scoreRecords.length ? (
        <div className="overflow-x-auto">
          <table className="score-history-ledger__table min-w-[920px] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3">No.</th>
                <th className="px-3 py-3">Mata pelajaran</th>
                <th className="px-3 py-3">Penilaian</th>
                <th className="px-3 py-3">KKM</th>
                <th className="px-3 py-3">Nilai</th>
                <th className="px-3 py-3">Status</th>
                {showPredikat && <th className="px-3 py-3">Predikat</th>}
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Aksi</th>
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
        </div>
      ) : (
        <div className="score-history-ledger__empty">
          <span className="score-history-ledger__empty-index">01</span>
          <div>
            <p className="font-semibold text-[var(--text)]">Belum ada nilai tercatat</p>
            <p className="mt-1 text-sm">Catat penilaian pertama untuk membuka riwayat akademik siswa.</p>
          </div>
        </div>
      )}
    </Surface>
  );
}
