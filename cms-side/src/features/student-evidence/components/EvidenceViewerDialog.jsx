import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/ui";
import "./EvidenceViewerDialog.css";

export default function EvidenceViewerDialog({
  evidence,
  onClose,
  onRequestRetraction,
}) {
  return (
    <Dialog open={Boolean(evidence)} onClose={onClose}>
      <DialogBackdrop className="evidence-viewer-dialog__backdrop" />
      <div className="evidence-viewer-dialog__container">
        <DialogPanel className="evidence-viewer-dialog__panel">
          <DialogTitle className="evidence-viewer-dialog__title">
            {evidence?.title || "Evidence siswa"}
          </DialogTitle>
          {evidence?.file?.url && (
            <img
              className="evidence-viewer-dialog__image"
              src={evidence.file.url}
              alt={evidence.title}
            />
          )}
          <div className="evidence-viewer-dialog__actions">
            <SecondaryButton type="button" onClick={onClose}>
              Tutup viewer
            </SecondaryButton>
            <PrimaryButton
              type="button"
              className="evidence-viewer-dialog__retract"
              onClick={() => onRequestRetraction(evidence)}
            >
              Cabut evidence
            </PrimaryButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
