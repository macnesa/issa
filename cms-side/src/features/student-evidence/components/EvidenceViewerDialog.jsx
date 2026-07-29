import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { DestructiveButton, SecondaryButton } from "../../../shared/ui/ui";

export default function EvidenceViewerDialog({
  demoReadOnly = false,
  evidence,
  onClose,
  onRequestRetraction,
}) {
  return (
    <Dialog open={Boolean(evidence)} onClose={onClose}>
      <DialogBackdrop className="issa-dialog-backdrop" />
      <div className="issa-dialog-container">
        <DialogPanel className="issa-dialog-panel evidence-viewer-dialog">
          <DialogTitle className="issa-dialog-title">
            {evidence?.title || "Evidence siswa"}
          </DialogTitle>
          {evidence?.file?.url && (
            <img
              className="evidence-viewer-dialog__image"
              src={evidence.file.url}
              alt={evidence.title}
            />
          )}
          <div className="issa-dialog-footer">
            <SecondaryButton type="button" onClick={onClose}>
              Tutup viewer
            </SecondaryButton>
            <DestructiveButton
              type="button"
              className="evidence-viewer-dialog__retract"
              disabled={demoReadOnly}
              onClick={() => {
                if (!demoReadOnly) onRequestRetraction(evidence);
              }}
            >
              Cabut evidence
            </DestructiveButton>
            {demoReadOnly && (
              <span className="evidence-viewer-dialog__demo">
                Tidak tersedia dalam mode demo.
              </span>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
