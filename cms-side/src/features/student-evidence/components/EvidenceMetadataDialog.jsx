import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import DateField from "../../../shared/ui/form-controls/DateField";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import TextField from "../../../shared/ui/form-controls/TextField";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/ui";
import { parseLocalDateValue } from "../../../utils/recordDates";
import {
  evidenceCategoryOptions,
  evidenceDateValue,
} from "../studentEvidence.constants";
import "./EvidenceMetadataDialog.css";

function correctionErrorMessage(error) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Evidence tidak dapat dikoreksi. Evidence mungkin dibuat oleh guru lain.";
  }
  return error?.message || "Koreksi evidence gagal disimpan.";
}

export default function EvidenceMetadataDialog({
  evidence,
  onClose,
  onSubmit,
  onSuccess,
}) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    observedAt: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!evidence) return;
    setForm({
      title: evidence.title || "",
      category: evidence.category || "",
      description: evidence.description || "",
      observedAt: evidenceDateValue(evidence.observedAt),
    });
    setErrors({});
    setStatusMessage("");
  }, [evidence]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatusMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!evidence || submittingRef.current) return;

    const title = form.title.trim();
    const description = form.description.trim();
    const nextErrors = {};
    if (!title || title.length > 120) {
      nextErrors.title = "Judul wajib diisi dan maksimal 120 karakter.";
    }
    if (!evidenceCategoryOptions.some(({ value }) => value === form.category)) {
      nextErrors.category = "Pilih kategori evidence yang valid.";
    }
    if (!parseLocalDateValue(form.observedAt)) {
      nextErrors.observedAt = "Tanggal observasi wajib valid.";
    }
    if (description.length > 500) {
      nextErrors.description = "Catatan maksimal 500 karakter.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("Periksa kembali metadata evidence.");
      return;
    }

    const metadata = {
      title,
      category: form.category,
      description,
      observedAt: form.observedAt,
    };
    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});
    setStatusMessage("");
    try {
      await onSubmit(evidence, metadata);
      onClose();
      await onSuccess(evidence.id);
    } catch (error) {
      setStatusMessage(correctionErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function closeDialog() {
    if (!submitting) onClose();
  }

  return (
    <Dialog open={Boolean(evidence)} onClose={closeDialog}>
      <DialogBackdrop className="evidence-metadata-dialog__backdrop" />
      <div className="evidence-metadata-dialog__container">
        <DialogPanel className="evidence-metadata-dialog__panel">
          <DialogTitle className="evidence-metadata-dialog__title">
            Edit metadata evidence
          </DialogTitle>
          <p className="evidence-metadata-dialog__intro">
            Koreksi informasi record tanpa mengubah gambar yang tersimpan.
          </p>

          {evidence && (
            <div className="evidence-metadata-dialog__reference">
              <img src={evidence.file?.url} alt="" />
              <div>
                <strong>{evidence.title}</strong>
                <span>Gambar referensi</span>
              </div>
            </div>
          )}

          <div className="evidence-metadata-dialog__notice">
            <strong>Gambar tidak dapat diganti dari form ini.</strong>
            <span>
              Untuk mengganti gambar, cabut evidence lalu unggah evidence baru.
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="evidence-metadata-dialog__fields">
              <TextField
                id="evidence-metadata-title"
                label="Judul"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                maxLength={120}
                required
                disabled={submitting}
                error={errors.title}
                autoFocus
              />
              <SelectField
                id="evidence-metadata-category"
                label="Kategori"
                value={form.category}
                options={evidenceCategoryOptions}
                onChange={(value) => updateField("category", value)}
                required
                disabled={submitting}
                error={errors.category}
              />
              <DateField
                id="evidence-metadata-observed-at"
                label="Tanggal observasi"
                value={form.observedAt}
                onChange={(value) => updateField("observedAt", value)}
                required
                disabled={submitting}
                error={errors.observedAt}
                tone="feedback"
              />
              <div className="issa-control-field">
                <label
                  className="issa-control-label"
                  htmlFor="evidence-metadata-description"
                >
                  Catatan <span className="issa-control-label__optional">Opsional</span>
                </label>
                <textarea
                  id="evidence-metadata-description"
                  className="issa-native-control issa-native-control--textarea"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  maxLength={500}
                  rows="4"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? "evidence-metadata-description-error"
                      : undefined
                  }
                />
                {errors.description && (
                  <p
                    id="evidence-metadata-description-error"
                    className="issa-control-error"
                  >
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <p
              className="evidence-metadata-dialog__status"
              role={statusMessage ? "alert" : "status"}
              aria-live="polite"
            >
              {statusMessage}
            </p>
            <div className="evidence-metadata-dialog__actions">
              <SecondaryButton
                type="button"
                onClick={closeDialog}
                disabled={submitting}
              >
                Batal
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan koreksi"}
              </PrimaryButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
