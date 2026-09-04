import { tw } from "../../../shared/ui/tw";
import { Textarea } from "flowbite-react/components/Textarea";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react/components/Modal";
import DateField from "../../../shared/ui/form-controls/DateField";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import TextField from "../../../shared/ui/form-controls/TextField";
import {
  InlineNotice,
  PrimaryButton,
  SecondaryButton,
} from "../../../shared/ui/ui";
import { parseLocalDateValue } from "../../../utils/recordDates";
import {
  evidenceCategoryOptions,
  evidenceDateValue,
} from "../studentEvidence.constants";

function correctionErrorMessage(error) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Bukti tidak dapat dikoreksi. Bukti mungkin dibuat oleh guru lain.";
  }
  return error?.message || "Koreksi bukti gagal disimpan.";
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
      nextErrors.category = "Pilih kategori bukti yang valid.";
    }
    if (!parseLocalDateValue(form.observedAt)) {
      nextErrors.observedAt = "Tanggal observasi wajib valid.";
    }
    if (description.length > 500) {
      nextErrors.description = "Catatan maksimal 500 karakter.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("Periksa kembali metadata bukti.");
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
    <Modal
      className={tw("evidence-metadata-dialog")}
      dismissible={!submitting}
      onClose={closeDialog}
      show={Boolean(evidence)}
      size="issaWide"
    >
      <ModalHeader>Edit metadata bukti</ModalHeader>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <p className={tw("issa-dialog-copy mt-1 px-4 text-supporting leading-normal text-issa-muted")}>
            Koreksi informasi record tanpa mengubah gambar yang tersimpan.
          </p>

          {evidence && (
            <div className={tw("evidence-metadata-dialog__reference flex min-w-0 items-center gap-3 border border-issa-border rounded-surface p-3 bg-issa-subtle m-4 [&>img]:w-16 [&>img]:h-16 [&>img]:flex-none [&>img]:rounded-control [&>img]:object-cover [&>div]:grid [&>div]:min-w-0 [&>div]:gap-1 [&_strong]:text-issa-text [&_strong]:text-supporting [&_span]:text-issa-muted [&_span]:text-metadata")}>
              <img src={evidence.file?.url} alt="" />
              <div>
                <strong>{evidence.title}</strong>
                <span>Gambar referensi</span>
              </div>
            </div>
          )}

          <div className={tw("evidence-metadata-dialog__notice grid gap-1 m-4 [&_span]:text-issa-muted [&_span]:text-metadata")}>
            <strong>Gambar tidak dapat diganti dari form ini.</strong>
            <span>
              Untuk mengganti gambar, cabut bukti lalu unggah bukti baru.
            </span>
          </div>

            <div className={tw("evidence-metadata-dialog__fields grid gap-4 m-4 md:grid-cols-2")}>
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
              />
              <div className={tw("issa-control-field min-w-0")}>
                <label
                  className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")}
                  htmlFor="evidence-metadata-description"
                >
                  Catatan <span className={tw("issa-control-label__optional ml-2 text-issa-muted text-metadata font-medium tracking-metadata uppercase")}>Opsional</span>
                </label>
                <Textarea
                  id="evidence-metadata-description"
                  className={tw("evidence-metadata-dialog__textarea min-h-28 resize-y leading-[1.55]")}
                  color={errors.description ? "failure" : "gray"}
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
                    className={tw("issa-control-error text-issa-danger font-semibold")}
                  >
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {statusMessage && (
              <InlineNotice
                className={tw("issa-dialog-error [margin:var(--issa-space-3)_var(--issa-space-4)]")}
                role="alert"
                tone="danger"
              >
                {statusMessage}
              </InlineNotice>
            )}
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </form>
    </Modal>
  );
}
