import { StatusBadge } from "../../../shared/ui/ui";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

export default function ModalAttendances({ data, id, studentName }) {
  const [isOpen, setIsOpen] = useState(false);
  const records = orderBy(data, [(record) => String(record.attendanceDate || "")], ['desc']);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="attendance-register__record-action inline-flex min-h-10 items-center border border-[var(--border-strong)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50">
        Lihat record
      </button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogBackdrop className="issa-dialog-backdrop" />
        <div className="issa-dialog-container">
          <DialogPanel className="issa-dialog-panel">
            <div className="border-b border-[var(--border)] p-5">
              <DialogTitle id={`${id}-title`} className="text-lg font-semibold text-[var(--text)]">Record attendance</DialogTitle>
              <p className="mt-1 text-sm text-[var(--muted)]">{studentName}</p>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto p-5">{isEmpty(records) && <p className="text-sm text-[var(--muted)]">Belum ada attendance.</p>}{records.map((record) => <div key={record.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><span className="text-sm font-medium text-[var(--text)]">{record.attendanceDate || "Tanggal attendance belum tersedia"}</span><StatusBadge status={record.status} /></div>)}</div>
            <div className="border-t border-[var(--border)] p-4 text-right">
              <button type="button" onClick={() => setIsOpen(false)} className="inline-flex min-h-10 items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Tutup</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
