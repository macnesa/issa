import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/ui";
import "./EvidenceRetractionDialog.css";

function retractionErrorMessage(error) {
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
      <DialogBackdrop className="evidence-retraction-dialog__backdrop" />
      <div className="evidence-retraction-dialog__container">
        <DialogPanel className="evidence-retraction-dialog__panel">
          <DialogTitle className="evidence-retraction-dialog__title">
            Cabut bukti perkembangan ini?
          </DialogTitle>
          <p className="evidence-retraction-dialog__warning">
            Gambar tidak lagi tersedia bagi guru maupun orang tua.
            Catatan jurnal yang pernah terhubung akan tetap tersedia,
            tetapi akan menunjukkan bahwa evidence telah dicabut.
          </p>

          {evidence && (
            <div className="evidence-retraction-dialog__reference">
              <img src={evidence.file?.url} alt="" />
              <strong>{evidence.title}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="issa-control-field evidence-retraction-dialog__reason">
              <label
                className="issa-control-label"
                htmlFor="evidence-retraction-reason"
              >
                Alasan pencabutan
              </label>
              <textarea
                id="evidence-retraction-reason"
                className="issa-native-control issa-native-control--textarea"
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
                className="issa-control-helper"
              >
                Jelaskan secara singkat mengapa evidence perlu dicabut.
                Alasan ini tidak ditampilkan kepada orang tua.
              </p>
              {reasonError && (
                <p
                  id="evidence-retraction-reason-error"
                  className="issa-control-error"
                >
                  {reasonError}
                </p>
              )}
            </div>

            <p
              className="evidence-retraction-dialog__status"
              role={statusMessage ? "alert" : "status"}
              aria-live="polite"
            >
              {statusMessage}
            </p>
            <div className="evidence-retraction-dialog__actions">
              <SecondaryButton
                type="button"
                onClick={closeDialog}
                disabled={submitting}
              >
                Batal
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                className="evidence-retraction-dialog__confirm"
                disabled={submitting}
              >
                {submitting ? "Mencabut..." : "Cabut evidence"}
              </PrimaryButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
