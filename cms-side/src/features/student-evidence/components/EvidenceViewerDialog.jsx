import { tw } from "../../../shared/ui/tw";
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
      <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
      <div className={tw("issa-dialog-container fixed z-dialog inset-0 grid place-items-center overflow-y-auto p-4")}>
        <DialogPanel className={tw("issa-dialog-panel [width:min(42rem,_100%)] [max-height:calc(100svh_-_var(--issa-space-8))] overflow-y-auto overflow-x-hidden border border-issa-border-strong rounded-dialog bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both] evidence-viewer-dialog")}>
          <DialogTitle className={tw("issa-dialog-title block border-b border-issa-border p-4 text-section-title font-bold leading-tight text-issa-text")}>
            {evidence?.title || "Evidence siswa"}
          </DialogTitle>
          {evidence?.file?.url && (
            <img
              className={tw("evidence-viewer-dialog__image block [width:calc(100%_-_(2_*_var(--issa-space-4)))] [max-height:65svh] m-4 rounded-surface object-contain bg-issa-subtle")}
              src={evidence.file.url}
              alt={evidence.title}
            />
          )}
          <div className={tw("issa-dialog-footer flex flex-wrap justify-end gap-2 border-t border-issa-border p-4")}>
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
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
