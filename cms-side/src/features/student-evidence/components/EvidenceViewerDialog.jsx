import { tw } from "../../../shared/ui/tw";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react/components/Modal";
import { DestructiveButton, SecondaryButton } from "../../../shared/ui/ui";

export default function EvidenceViewerDialog({
  demoReadOnly = false,
  evidence,
  onClose,
  onRequestRetraction,
}) {
  return (
    <Modal
      className={tw("evidence-viewer-dialog")}
      dismissible
      onClose={onClose}
      show={Boolean(evidence)}
      size="issaWide"
    >
      <ModalHeader>{evidence?.title || "Evidence siswa"}</ModalHeader>
      <ModalBody>
        {evidence?.file?.url && (
            <img
              className={tw("evidence-viewer-dialog__image block w-full [max-height:65svh] rounded-surface object-contain bg-issa-subtle")}
              src={evidence.file.url}
              alt={evidence.title}
            />
        )}
      </ModalBody>
      <ModalFooter>
        <SecondaryButton type="button" onClick={onClose}>
          Tutup viewer
        </SecondaryButton>
        <DestructiveButton
          type="button"
          className={tw("evidence-viewer-dialog__retract")}
          disabled={demoReadOnly}
          onClick={() => {
            if (!demoReadOnly) onRequestRetraction(evidence);
          }}
        >
          Cabut evidence
        </DestructiveButton>
        {demoReadOnly && (
          <span className={tw("evidence-viewer-dialog__demo text-issa-muted text-metadata")}>
            Tidak tersedia dalam mode demo.
          </span>
        )}
      </ModalFooter>
    </Modal>
  );
}
