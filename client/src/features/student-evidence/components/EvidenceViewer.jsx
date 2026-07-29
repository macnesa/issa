import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import {
  evidenceCategoryLabels,
  formatEvidenceObservedDate,
} from '../studentEvidence.constants';

export default function EvidenceViewer({ evidence, onClose }) {
  return (
    <Dialog
      open={Boolean(evidence)}
      onClose={onClose}
      className="relative z-[60]"
    >
      <DialogBackdrop className="dialog-backdrop" />
      <div className="dialog-frame">
        <DialogPanel className="dialog-panel">
          <header className="flex items-center justify-between gap-4 px-[1.1rem] py-4">
            <div>
              <p className="m-0 text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-[#a9d6df]">
                Bukti perkembangan
              </p>
              <DialogTitle className="mt-[0.2rem] text-base font-bold text-white">
                {evidence?.title || 'Dokumentasi siswa'}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup gambar"
              className="secondary-button evidence-dialog__close"
            >
              Tutup
            </button>
          </header>
          {evidence && (
            <>
              <img
                className="block max-h-[calc(100vh-13rem)] w-full bg-[#081d27] object-contain"
                src={evidence.file?.url}
                alt={evidence.title}
              />
              <div className="flex flex-wrap items-baseline gap-x-[0.8rem] gap-y-[0.35rem] px-[1.1rem] pb-4 pt-[0.85rem] text-[0.76rem] text-[#d9e8e9]">
                <span className="font-extrabold text-[#b7dce1]">
                  {evidenceCategoryLabels[evidence.category]
                    || evidence.category
                    || 'Kategori tidak tersedia'}
                </span>
                <time className="text-[#c6d3d4]" dateTime={evidence.observedAt}>
                  {formatEvidenceObservedDate(evidence.observedAt)}
                </time>
                {evidence.description && (
                  <p className="mt-[0.22rem] basis-full [overflow-wrap:anywhere] text-[#edf4f4] leading-[1.55]">
                    {evidence.description}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
