import { tw } from "../../../shared/ui/tw";
import { Textarea } from "flowbite-react/components/Textarea";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { DestructiveButton, SecondaryButton } from "../../../shared/ui/ui";

function retractionErrorMessage(error) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 502) {
    return "Gambar belum berhasil dicabut dari penyimpanan. Silakan coba kembali.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Evidence tidak dapat dicabut. Evidence mungkin dibuat oleh guru lain.";
  }
  return error?.message || "Evidence belum berhasil dicabut.";
}

export default function EvidenceRetractionDialog({
  evidence,
  onClose,
  onSubmit,
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setReason("");
    setReasonError("");
    setStatusMessage("");
  }, [evidence]);

  function closeDialog() {
    if (!submitting) onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!evidence || submittingRef.current) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3 || trimmedReason.length > 300) {
      setReasonError("Alasan harus terdiri dari 3–300 karakter.");
      setStatusMessage("Periksa kembali alasan pencabutan.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setReasonError("");
    setStatusMessage("");
    try {
      await onSubmit(evidence, trimmedReason);
      onClose();
      await onSuccess(evidence.id);
    } catch (error) {
      setStatusMessage(retractionErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(evidence)} onClose={closeDialog}>
      <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
      <div className={tw("issa-dialog-container fixed z-dialog inset-0 grid place-items-center overflow-y-auto p-4")}>
        <DialogPanel className={tw("issa-dialog-panel [width:min(42rem,_100%)] [max-height:calc(100svh_-_var(--issa-space-8))] overflow-y-auto overflow-x-hidden border border-issa-border-strong rounded-dialog bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both] evidence-retraction-dialog")}>
          <DialogTitle className={tw("issa-dialog-title block border-b border-issa-border p-4 text-section-title font-bold leading-tight text-issa-text")}>
            Cabut bukti perkembangan ini?
          </DialogTitle>
          <p className={tw("issa-dialog-copy mt-1 px-4 text-supporting leading-normal text-issa-muted")}>
            Gambar tidak lagi tersedia bagi guru maupun orang tua.
            Catatan jurnal yang pernah terhubung akan tetap tersedia,
            tetapi akan menunjukkan bahwa evidence telah dicabut.
          </p>

          {evidence && (
            <div className={tw("evidence-retraction-dialog__reference flex min-w-0 items-center gap-3 border border-issa-border rounded-surface p-3 bg-issa-subtle m-4 [&>img]:w-16 [&>img]:h-16 [&>img]:flex-none [&>img]:rounded-control [&>img]:object-cover [&_strong]:text-issa-text [&_strong]:text-supporting")}>
              <img src={evidence.file?.url} alt="" />
              <strong>{evidence.title}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={tw("issa-control-field min-w-0 evidence-retraction-dialog__reason m-4")}>
              <label
                className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")}
                htmlFor="evidence-retraction-reason"
              >
                Alasan pencabutan
              </label>
              <Textarea
                id="evidence-retraction-reason"
                className={tw("evidence-retraction-dialog__textarea min-h-28 resize-y leading-[1.55]")}
                color={reasonError ? "failure" : "gray"}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError("");
                  setStatusMessage("");
                }}
                minLength={3}
                maxLength={300}
                rows="4"
                required
                disabled={submitting}
                autoFocus
                aria-invalid={Boolean(reasonError)}
                aria-describedby={
                  [
                    "evidence-retraction-reason-helper",
                    reasonError ? "evidence-retraction-reason-error" : "",
                  ].filter(Boolean).join(" ")
                }
              />
              <p
                id="evidence-retraction-reason-helper"
                className={tw("issa-control-helper text-issa-muted")}
              >
                Jelaskan secara singkat mengapa evidence perlu dicabut.
                Alasan ini tidak ditampilkan kepada orang tua.
              </p>
              {reasonError && (
                <p
                  id="evidence-retraction-reason-error"
                  className={tw("issa-control-error text-issa-danger font-semibold")}
                >
                  {reasonError}
                </p>
              )}
            </div>

            <p
              className={tw("issa-dialog-error min-h-6 [margin:var(--issa-space-3)_var(--issa-space-4)] text-issa-danger text-supporting font-semibold")}
              role={statusMessage ? "alert" : "status"}
              aria-live="polite"
            >
              {statusMessage}
            </p>
            <div className={tw("issa-dialog-footer flex flex-wrap justify-end gap-2 border-t border-issa-border p-4")}>
              <SecondaryButton
                type="button"
                onClick={closeDialog}
                disabled={submitting}
              >
                Batal
              </SecondaryButton>
              <DestructiveButton
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Mencabut..." : "Cabut evidence"}
              </DestructiveButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
