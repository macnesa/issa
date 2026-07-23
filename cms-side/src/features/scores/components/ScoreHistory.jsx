import { EmptyState, Surface } from "../../../shared/ui/ui";
import TableScores from "./TableScores";

export default function ScoreHistory({ scores, student }) {
  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-semibold text-[var(--text)]">Riwayat score</h2><p className="mt-1 text-sm text-[var(--muted)]">Status berasal dari backend berdasarkan KKM mata pelajaran.</p></div>
      {scores?.length ? <div className="overflow-x-auto"><table className="min-w-[860px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"><tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Pelajaran</th><th className="px-4 py-3">KKM</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody>{scores.map((score) => <TableScores key={score.id} data={score} student={student} />)}</tbody></table></div> : <div className="p-5"><EmptyState title="Belum ada score" description="Catat assessment pertama untuk menampilkan record akademik." /></div>}
    </Surface>
  );
}
