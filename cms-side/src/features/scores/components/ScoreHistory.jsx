import { Surface } from "../../../shared/ui/ui";
import TableScores from "./TableScores";

export default function ScoreHistory({ scores, student }) {
  return (
    <Surface className="score-history-ledger">
      <div className="score-history-ledger__header"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#745594]">Academic ledger</p><h2 className="mt-1 font-semibold text-[var(--text)]">Riwayat nilai</h2><p className="mt-1 text-sm text-[var(--muted)]">Status berasal dari backend berdasarkan KKM mata pelajaran.</p></div>
      {scores?.length ? <div className="overflow-x-auto"><table className="score-history-ledger__table min-w-[860px] w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide"><tr><th className="px-4 py-3">No.</th><th className="px-4 py-3">Mata pelajaran / assessment</th><th className="px-4 py-3">KKM</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody>{scores.map((score, index) => <TableScores key={score.id} data={score} student={student} recordIndex={index + 1} />)}</tbody></table></div> : <div className="score-history-ledger__empty"><span className="score-history-ledger__empty-index">01</span><div><p className="font-semibold text-[var(--text)]">Belum ada nilai tercatat</p><p className="mt-1 text-sm">Catat assessment pertama untuk membuka register akademik siswa.</p></div></div>}
    </Surface>
  );
}
