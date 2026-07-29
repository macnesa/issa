import {
  EmptyState,
  SecondaryButton,
  StatusBadge,
} from "../../../shared/ui/ui";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

export default function ModalAttendances({ data, id, studentName }) {
  const [isOpen, setIsOpen] = useState(false);
  const records = orderBy(data, [(record) => String(record.attendanceDate || "")], ['desc']);
  return (
    <>
      <SecondaryButton compact type="button" onClick={() => setIsOpen(true)} className="attendance-register__record-action">
        Lihat record
      </SecondaryButton>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogBackdrop className="issa-dialog-backdrop" />
        <div className="issa-dialog-container">
          <DialogPanel className="issa-dialog-panel">
            <div className="issa-dialog-header">
              <DialogTitle id={`${id}-title`}>Record attendance</DialogTitle>
              <p>{studentName}</p>
            </div>
            <div className="issa-dialog-body attendance-record-dialog__body">{isEmpty(records) && <EmptyState title="Belum ada attendance" />}{records.map((record) => <div key={record.id} className="attendance-record-dialog__entry"><span>{record.attendanceDate || "Tanggal attendance belum tersedia"}</span><StatusBadge status={record.status} /></div>)}</div>
            <div className="issa-dialog-footer">
              <SecondaryButton type="button" onClick={() => setIsOpen(false)}>Tutup</SecondaryButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
