import { tw } from "../../../shared/ui/tw";
import {
  EmptyState,
  SecondaryButton,
  StatusBadge,
} from "../../../shared/ui/ui";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { formatDateDisplay } from "../../../utils/recordDates";

export default function ModalAttendances({ data, id, studentName }) {
  const [isOpen, setIsOpen] = useState(false);
  const records = orderBy(data, [(record) => String(record.attendanceDate || "")], ['desc']);
  return (
    <>
      <SecondaryButton compact type="button" onClick={() => setIsOpen(true)} className={tw("attendance-register__record-action max-lg:w-full")}>
        Lihat record
      </SecondaryButton>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
        <div className={tw("issa-dialog-container fixed z-dialog inset-0 grid place-items-center overflow-y-auto p-4")}>
          <DialogPanel className={tw("issa-dialog-panel [width:min(32rem,_100%)] overflow-hidden border border-issa-border-strong rounded-dialog bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both]")}>
            <div className={tw("issa-dialog-header border-b border-issa-border p-4")}>
              <DialogTitle id={`${id}-title`}>Record attendance</DialogTitle>
              <p>{studentName}</p>
            </div>
            <div className={tw("issa-dialog-body attendance-record-dialog__body grid max-h-80 gap-2 overflow-y-auto p-4 text-supporting leading-normal text-issa-muted")}>{isEmpty(records) && <EmptyState title="Belum ada attendance" />}{records.map((record) => <div key={record.id} className={tw("attendance-record-dialog__entry flex items-center justify-between gap-3 border border-issa-border rounded-surface p-3")}><span>{formatDateDisplay(record.attendanceDate) || "Tanggal attendance belum tersedia"}</span><StatusBadge status={record.status} /></div>)}</div>
            <div className={tw("issa-dialog-footer flex flex-wrap justify-end gap-2 border-t border-issa-border p-4")}>
              <SecondaryButton type="button" onClick={() => setIsOpen(false)}>Tutup</SecondaryButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
