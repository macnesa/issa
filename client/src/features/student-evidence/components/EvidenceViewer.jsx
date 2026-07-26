import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import './EvidenceViewer.css';

export default function EvidenceViewer({ evidence, onClose }) {
  return (
    <Dialog
      open={Boolean(evidence)}
      onClose={onClose}
      className="evidence-viewer"
    >
      <DialogBackdrop className="evidence-viewer__backdrop" />
      <div className="evidence-viewer__container">
        <DialogPanel className="evidence-viewer__panel">
          <header className="evidence-viewer__header">
            <div>
              <p>Bukti perkembangan</p>
              <DialogTitle>{evidence?.title || 'Dokumentasi siswa'}</DialogTitle>
            </div>
            <button type="button" onClick={onClose} aria-label="Tutup gambar">
              Tutup
            </button>
          </header>
          {evidence && (
            <img
              className="evidence-viewer__image"
              src={evidence.file?.url}
              alt={evidence.title}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
