import { tw } from "../../../shared/ui/tw";
import {
  EmptyState,
  SecondaryButton,
  StatusBadge,
} from "../../../shared/ui/ui";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react/components/Modal";
import { formatDateDisplay } from "../../../utils/recordDates";

export default function ModalAttendances({ data, id, studentName }) {
  const [isOpen, setIsOpen] = useState(false);
  const records = orderBy(data, [(record) => String(record.attendanceDate || "")], ['desc']);
  return (
    <>
      <SecondaryButton compact type="button" onClick={() => setIsOpen(true)} className={tw("attendance-register__record-action max-lg:w-full")}>
        Lihat record
      </SecondaryButton>
      <Modal
        dismissible
        onClose={() => setIsOpen(false)}
        show={isOpen}
        size="issaCompact"
      >
        <ModalHeader id={`${id}-title`}>Record attendance</ModalHeader>
        <ModalBody className={tw("attendance-record-dialog__body grid max-h-80 gap-2 text-supporting leading-normal text-issa-muted")}>
          <p className={tw("font-semibold text-issa-text")}>{studentName}</p>
          {isEmpty(records) && <EmptyState title="Belum ada attendance" />}
          {records.map((record) => <div key={record.id} className={tw("attendance-record-dialog__entry flex items-center justify-between gap-3 border border-issa-border rounded-surface p-3")}><span>{formatDateDisplay(record.attendanceDate) || "Tanggal attendance belum tersedia"}</span><StatusBadge status={record.status} /></div>)}
        </ModalBody>
        <ModalFooter>
          <SecondaryButton type="button" onClick={() => setIsOpen(false)}>Tutup</SecondaryButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
