import { tw } from "../../../shared/ui/tw";
import { FileInput } from "flowbite-react/components/FileInput";
import { HelperText } from "flowbite-react/components/HelperText";
import { Label } from "flowbite-react/components/Label";
import { Textarea } from "flowbite-react/components/Textarea";
import { useEffect, useRef, useState } from "react";
import {
  InlineNotice,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
} from "../../../shared/ui/ui";
import DateField from "../../../shared/ui/form-controls/DateField";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import TextField from "../../../shared/ui/form-controls/TextField";
import { localDateValue, parseLocalDateValue } from "../../../utils/recordDates";
import {
  evidenceCategoryOptions,
  formatEvidenceFileSize,
  maximumEvidenceFileSize,
  supportedEvidenceMimeTypes,
} from "../studentEvidence.constants";

function validateSelectedFile(file) {
  if (!file) return "Pilih satu file gambar.";
  if (!supportedEvidenceMimeTypes.has(file.type)) {
    return "Gunakan file JPEG, PNG, atau WEBP.";
  }
  if (!Number.isFinite(file.size) || file.size < 1) {
    return "File gambar tidak valid.";
  }
  if (file.size > maximumEvidenceFileSize) {
    return "Ukuran file maksimal 5 MB.";
  }
  return "";
}

function getSubmitError(error) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 503) {
    return "Penyimpanan gambar belum dikonfigurasi pada server.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Anda tidak memiliki akses untuk menyimpan bukti siswa ini.";
  }
  return error?.message || "Bukti perkembangan gagal disimpan.";
}

export default function EvidenceUploadForm({ demoReadOnly = false, onUpload }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [observedAt, setObservedAt] = useState(() => localDateValue());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  function clearFile() {
    setFile(null);
    setErrors((current) => ({ ...current, file: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    clearFile();
    setTitle("");
    setCategory("");
    setDescription("");
    setObservedAt(localDateValue());
    setErrors({});
  }

  function handleFileChange(event) {
    if (demoReadOnly) {
      event.target.value = "";
      return;
    }
    const selectedFile = event.target.files?.[0] || null;
    const fileError = validateSelectedFile(selectedFile);
    setStatusMessage("");
    if (fileError) {
      setFile(null);
      setErrors((current) => ({ ...current, file: fileError }));
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setErrors((current) => ({ ...current, file: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (demoReadOnly) {
      setStatusMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }

    const nextErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle || trimmedTitle.length > 120) {
      nextErrors.title = "Judul wajib diisi dan maksimal 120 karakter.";
    }
    if (!category) nextErrors.category = "Pilih kategori evidence.";
    if (!parseLocalDateValue(observedAt)) {
      nextErrors.observedAt = "Tanggal observasi wajib valid.";
    }
    if (trimmedDescription.length > 500) {
      nextErrors.description = "Deskripsi maksimal 500 karakter.";
    }
    const fileError = validateSelectedFile(file);
    if (fileError) nextErrors.file = fileError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("Periksa kembali data evidence.");
      return;
    }

    const evidenceFormData = new FormData();
    evidenceFormData.append("file", file);
    evidenceFormData.append("title", trimmedTitle);
    evidenceFormData.append("category", category);
    evidenceFormData.append("description", trimmedDescription);
    evidenceFormData.append("observedAt", observedAt);

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});
    setStatusMessage("");
    try {
      await onUpload(evidenceFormData);
      resetForm();
      setStatusMessage("Bukti perkembangan berhasil disimpan.");
    } catch (error) {
      setStatusMessage(getSubmitError(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className={tw("evidence-upload border-b border-issa-border")}>
      <div className={tw("evidence-upload__heading px-5 pb-3 pt-5 bg-issa-surface [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-medium [&_p]:tracking-normal [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-semibold")}>
        <p>Upload evidence</p>
        <h3>Tambahkan satu foto bukti siswa</h3>
      </div>

      <form className={tw("evidence-upload__form grid gap-4 p-4")} onSubmit={handleSubmit} noValidate>
        {demoReadOnly && (
          <InlineNotice tone="warning" role="note">
            Tidak tersedia dalam mode demo.
          </InlineNotice>
        )}
        <div className={tw("evidence-upload__file-field grid gap-1 [&_p]:text-issa-muted [&_p]:text-metadata")}>
          <Label htmlFor="student-evidence-file">Foto evidence</Label>
          <FileInput
            ref={fileInputRef}
            id="student-evidence-file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            aria-describedby={[
              "student-evidence-file-help",
              errors.file ? "student-evidence-file-error" : "",
            ].filter(Boolean).join(" ")}
            aria-invalid={Boolean(errors.file)}
            disabled={submitting || demoReadOnly}
            className={tw("evidence-upload__file-control")}
            color={errors.file ? "failure" : "issa"}
            sizing="issa"
          />
          <HelperText id="student-evidence-file-help">
            JPEG, PNG, atau WEBP · maksimal 5 MB.
          </HelperText>
          {errors.file && (
            <HelperText
              id="student-evidence-file-error"
              className={tw("evidence-upload__error font-semibold")}
              color="failure"
            >
              {errors.file}
            </HelperText>
          )}
        </div>

        {file && previewUrl && (
          <div className={tw("evidence-upload__preview flex min-w-0 items-center gap-3 border border-issa-border rounded-surface p-3 bg-issa-subtle [&>img]:w-16 [&>img]:h-16 [&>img]:flex-none [&>img]:rounded-control [&>img]:object-cover [&>div]:grid [&>div]:min-w-0 [&>div]:gap-1 [&_strong]:text-issa-text [&_strong]:text-supporting [&_span]:text-issa-muted [&_span]:text-metadata")}>
            <img src={previewUrl} alt={`Preview ${title.trim() || file.name}`} />
            <div>
              <strong>{file.name}</strong>
              <span>{formatEvidenceFileSize(file.size)}</span>
              <div className={tw("evidence-upload__preview-actions flex flex-wrap items-center gap-2")}>
                <label className={tw("cursor-pointer text-issa-accent text-button font-bold")} htmlFor="student-evidence-file">Ganti file</label>
                <TertiaryButton compact type="button" onClick={clearFile} disabled={submitting}>
                  Hapus file
                </TertiaryButton>
              </div>
            </div>
          </div>
        )}

        <div className={tw("evidence-upload__fields grid gap-4 md:grid-cols-2")}>
          <TextField
            id="student-evidence-title"
            label="Judul"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            disabled={submitting || demoReadOnly}
            error={errors.title}
          />
          <SelectField
            id="student-evidence-category"
            label="Kategori"
            value={category}
            options={evidenceCategoryOptions}
            placeholder="Pilih kategori"
            onChange={setCategory}
            required
            disabled={submitting || demoReadOnly}
            error={errors.category}
          />
          <DateField
            id="student-evidence-observed-at"
            label="Tanggal observasi"
            value={observedAt}
            onChange={setObservedAt}
            required
            disabled={submitting || demoReadOnly}
            error={errors.observedAt}
          />
          <div className={tw("issa-control-field min-w-0 evidence-upload__description col-span-full")}>
            <label className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")} htmlFor="student-evidence-description">
              Deskripsi <span className={tw("issa-control-label__optional ml-2 text-issa-muted text-metadata font-medium tracking-normal")}>Opsional</span>
            </label>
            <Textarea
              id="student-evidence-description"
              className={tw("evidence-upload__description-control min-h-28 resize-y leading-[1.55]")}
              color={errors.description ? "failure" : "gray"}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows="4"
              disabled={submitting || demoReadOnly}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "student-evidence-description-error" : undefined}
            />
            {errors.description && (
              <p id="student-evidence-description-error" className={tw("issa-control-error text-issa-danger font-semibold")}>
                {errors.description}
              </p>
            )}
          </div>
        </div>

        <div className={tw("evidence-upload__actions flex flex-wrap items-center gap-2 max-sm:[&>.issa-button]:w-full")}>
          <PrimaryButton type="submit" disabled={submitting || demoReadOnly}>
            {submitting ? "Mengunggah..." : "Simpan evidence"}
          </PrimaryButton>
          {(file || title || category || description) && (
            <SecondaryButton type="button" onClick={resetForm} disabled={submitting || demoReadOnly}>
              Reset form
            </SecondaryButton>
          )}
          <p className={tw("evidence-upload__status min-w-0 [flex:1_1_12rem] text-issa-muted text-metadata")} role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </form>
    </div>
  );
}
