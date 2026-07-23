import { StatusBadge } from "../../../shared/ui/ui";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";

export default function ModalAttendances({ data, id, studentName }) {
  const records = orderBy(data, [(record) => String(record.attendanceDate || "")], ['desc']);
  return <><label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50">Lihat record</label><input type="checkbox" id={id} className="modal-toggle" /><div className="modal px-4"><div className="modal-box max-w-lg rounded-2xl bg-white p-0"><div className="border-b border-[var(--border)] p-5"><h3 className="text-lg font-semibold text-[var(--text)]">Record attendance</h3><p className="mt-1 text-sm text-[var(--muted)]">{studentName}</p></div><div className="max-h-80 space-y-3 overflow-y-auto p-5">{isEmpty(records) && <p className="text-sm text-[var(--muted)]">Belum ada attendance.</p>}{records.map((record) => <div key={record.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><span className="text-sm font-medium text-[var(--text)]">{record.attendanceDate || "Tanggal attendance belum tersedia"}</span><StatusBadge status={record.status} /></div>)}</div><div className="border-t border-[var(--border)] p-4 text-right"><label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Tutup</label></div></div></div></>;
}
