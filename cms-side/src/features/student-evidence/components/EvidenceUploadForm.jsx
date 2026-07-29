import { useEffect, useRef, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/ui";
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
import "./EvidenceUploadForm.css";

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
    <div className="evidence-upload">
      <div className="evidence-upload__heading">
        <p>Upload evidence</p>
        <h3>Tambahkan satu foto record siswa</h3>
      </div>

      <form className="evidence-upload__form" onSubmit={handleSubmit} noValidate>
        {demoReadOnly && (
          <p className="m-0 text-sm font-semibold text-[var(--muted)]">
            Tidak tersedia dalam mode demo.
          </p>
        )}
        <div className="evidence-upload__file-field">
          <label htmlFor="student-evidence-file">Foto evidence</label>
          <input
            ref={fileInputRef}
            id="student-evidence-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            aria-describedby="student-evidence-file-help student-evidence-file-error"
            aria-invalid={Boolean(errors.file)}
            disabled={submitting || demoReadOnly}
          />
          <p id="student-evidence-file-help">JPEG, PNG, atau WEBP · maksimal 5 MB.</p>
          {errors.file && <p id="student-evidence-file-error" className="evidence-upload__error">{errors.file}</p>}
        </div>

        {file && previewUrl && (
          <div className="evidence-upload__preview">
            <img src={previewUrl} alt={`Preview ${title.trim() || file.name}`} />
            <div>
              <strong>{file.name}</strong>
              <span>{formatEvidenceFileSize(file.size)}</span>
              <div className="evidence-upload__preview-actions">
                <label htmlFor="student-evidence-file">Ganti file</label>
                <button type="button" onClick={clearFile} disabled={submitting}>
                  Hapus file
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="evidence-upload__fields">
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
            tone="feedback"
          />
          <div className="issa-control-field evidence-upload__description">
            <label className="issa-control-label" htmlFor="student-evidence-description">
              Deskripsi <span className="issa-control-label__optional">Opsional</span>
            </label>
            <textarea
              id="student-evidence-description"
              className="issa-native-control issa-native-control--textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows="4"
              disabled={submitting || demoReadOnly}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "student-evidence-description-error" : undefined}
            />
            {errors.description && (
              <p id="student-evidence-description-error" className="issa-control-error">
                {errors.description}
              </p>
            )}
          </div>
        </div>

        <div className="evidence-upload__actions">
          <PrimaryButton type="submit" disabled={submitting || demoReadOnly}>
            {submitting ? "Mengunggah..." : "Simpan evidence"}
          </PrimaryButton>
          {(file || title || category || description) && (
            <SecondaryButton type="button" onClick={resetForm} disabled={submitting || demoReadOnly}>
              Reset form
            </SecondaryButton>
          )}
          <p className="evidence-upload__status" role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </form>
    </div>
  );
}
