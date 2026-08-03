import { tw } from "../../../shared/ui/tw";
import { nativeControlClasses } from "../../../shared/ui/form-controls/controlStyles";
import { useEffect, useRef, useState } from "react";
import DateField from "../../../shared/ui/form-controls/DateField";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import {
  InlineNotice,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "../../../shared/ui/ui";
import { localDateValue, parseLocalDateValue } from "../../../utils/recordDates";
import {
  formatJournalDate,
  journalDateValue,
  journalEntryTypeOptions,
  journalEntryTypes,
  journalVoiceCaptureOptions,
  journalVoiceCaptureTypes,
  maximumJournalContentLength,
} from "../studentLearningJournal.constants";

function emptyForm() {
  return {
    type: "",
    content: "",
    voiceCaptureType: "",
    observedAt: localDateValue(),
    evidenceId: "",
  };
}

function formFromEntry(entry) {
  return {
    type: entry.type || "",
    content: entry.content || "",
    voiceCaptureType: entry.type === "student_reflection"
      ? entry.voiceCaptureType || ""
      : "",
    observedAt: journalDateValue(entry.observedAt) || localDateValue(),
    evidenceId: entry.evidence?.id ? String(entry.evidence.id) : "",
  };
}

function submitErrorMessage(error, editing) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return editing
      ? "Koreksi tidak dapat disimpan. Catatan mungkin dibuat oleh guru lain."
      : "Anda tidak memiliki akses untuk menyimpan catatan siswa ini.";
  }
  return error?.message || (
    editing
      ? "Koreksi catatan gagal disimpan."
      : "Catatan perjalanan belajar gagal disimpan."
  );
}

export default function JournalEntryForm({
  editingEntry,
  evidences,
  evidenceStatus,
  evidenceError,
  onSubmit,
  onCancelEdit,
  demoReadOnly = false,
  readOnly = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const submittingRef = useRef(false);
  const editing = Boolean(editingEntry);

  useEffect(() => {
    setForm(editingEntry ? formFromEntry(editingEntry) : emptyForm());
    setErrors({});
    setStatusMessage("");
  }, [editingEntry]);

  useEffect(() => {
    if (evidenceStatus !== "success") return;
    setForm((current) => {
      if (
        !current.evidenceId ||
        evidences.some((evidence) => String(evidence.id) === current.evidenceId)
      ) {
        return current;
      }
      return { ...current, evidenceId: "" };
    });
  }, [evidences, evidenceStatus]);

  const evidenceOptions = [
    { value: "", label: "Tidak dihubungkan ke evidence" },
    ...evidences.map((evidence) => ({
      value: String(evidence.id),
      label: `${evidence.title} — ${formatJournalDate(evidence.observedAt)}`,
    })),
  ];

  function updateField(field, value) {
    setStatusMessage("");
    setErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "type" && value !== "student_reflection") {
        next.voiceCaptureType = "";
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (readOnly) {
      setStatusMessage(
        demoReadOnly
          ? "Perubahan data tidak tersedia dalam mode demo."
          : "Mode offline hanya menampilkan catatan yang telah tersimpan."
      );
      return;
    }

    const content = form.content.trim();
    const nextErrors = {};
    if (!form.type) nextErrors.type = "Pilih jenis catatan.";
    if (content.length < 3 || content.length > maximumJournalContentLength) {
      nextErrors.content = "Isi catatan harus 3–1500 karakter.";
    }
    if (!parseLocalDateValue(form.observedAt)) {
      nextErrors.observedAt = "Tanggal observasi wajib valid.";
    }
    if (
      form.type === "student_reflection"
      && !form.voiceCaptureType
    ) {
      nextErrors.voiceCaptureType = "Pilih tipe pencatatan refleksi.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("Periksa kembali data catatan.");
      return;
    }

    const payload = {
      type: form.type,
      content,
      observedAt: form.observedAt,
      evidenceId: form.evidenceId ? Number(form.evidenceId) : null,
    };
    if (form.type === "student_reflection") {
      payload.voiceCaptureType = form.voiceCaptureType;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});
    setStatusMessage("");
    try {
      await onSubmit(payload);
      if (!editing) setForm(emptyForm());
      setStatusMessage(
        editing
          ? "Koreksi catatan berhasil disimpan."
          : "Catatan perjalanan belajar berhasil disimpan."
      );
    } catch (error) {
      setStatusMessage(submitErrorMessage(error, editing));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setForm(emptyForm());
    setErrors({});
    setStatusMessage("");
    onCancelEdit();
  }

  const selectedType = journalEntryTypes[form.type];
  const selectedCaptureType = journalVoiceCaptureTypes[form.voiceCaptureType];

  return (
    <Surface className={tw(
      "journal-entry-form m-4 overflow-hidden",
      editing && "is-editing border-issa-warning"
    )}>
      <div className={tw("journal-entry-form__heading border-b border-issa-border p-4 bg-issa-subtle [&_p]:text-issa-accent [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold [&>span]:block [&>span]:mt-1 [&>span]:text-issa-muted [&>span]:text-supporting")}>
        <p>{editing ? "Correction mode" : "New journal entry"}</p>
        <h3>{editing ? "Koreksi catatan" : "Catat perjalanan belajar"}</h3>
        {editing && (
          <span>Perubahan akan ditandai sebagai catatan yang diedit.</span>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {demoReadOnly && (
          <InlineNotice className={tw("journal-entry-form__demo [margin:var(--issa-space-4)_var(--issa-space-4)_0]")} tone="warning" role="note">
            Tidak tersedia dalam mode demo.
          </InlineNotice>
        )}
        <div className={tw("journal-entry-form__fields grid gap-4 p-4 md:grid-cols-2")}>
          <SelectField
            id="student-journal-type"
            label="Jenis catatan"
            value={form.type}
            options={journalEntryTypeOptions}
            placeholder="Pilih jenis catatan"
            onChange={(value) => updateField("type", value)}
            helperText={selectedType?.helper}
            error={errors.type}
            required
            disabled={submitting || readOnly}
          />

          <DateField
            id="student-journal-observed-at"
            label="Tanggal observasi"
            value={form.observedAt}
            onChange={(value) => updateField("observedAt", value)}
            error={errors.observedAt}
            required
            disabled={submitting || readOnly}
          />

          {form.type === "student_reflection" && (
            <SelectField
              id="student-journal-capture-type"
              label="Tipe pencatatan refleksi"
              value={form.voiceCaptureType}
              options={journalVoiceCaptureOptions}
              placeholder="Pilih sumber refleksi"
              onChange={(value) => updateField("voiceCaptureType", value)}
              helperText={selectedCaptureType?.helper}
              error={errors.voiceCaptureType}
              required
              disabled={submitting || readOnly}
            />
          )}

          <SelectField
            id="student-journal-evidence"
            label="Evidence terkait"
            value={form.evidenceId}
            options={evidenceOptions}
            placeholder="Tidak dihubungkan ke evidence"
            onChange={(value) => updateField("evidenceId", value)}
            helperText={
              evidenceStatus === "error"
                ? evidenceError || "Evidence siswa belum dapat dimuat."
                : "Opsional · pilih satu evidence milik siswa ini."
            }
            disabled={readOnly || submitting || evidenceStatus === "loading"}
          />

          <div className={tw("issa-control-field min-w-0 journal-entry-form__content col-span-full")}>
            <div className={tw("journal-entry-form__content-label flex items-center justify-between gap-3 [&_span]:text-issa-muted [&_span]:text-metadata")}>
              <label className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")} htmlFor="student-journal-content">
                Isi catatan
              </label>
              <span aria-hidden="true">
                {form.content.length}/{maximumJournalContentLength}
              </span>
            </div>
            <textarea
              id="student-journal-content"
              className={tw(nativeControlClasses, "issa-native-control--textarea min-h-28 resize-y px-3 py-2 leading-[1.55]")}
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              minLength={3}
              maxLength={maximumJournalContentLength}
              rows="6"
              required
              disabled={submitting || readOnly}
              aria-invalid={Boolean(errors.content)}
              aria-describedby={
                errors.content
                  ? "student-journal-content-help student-journal-content-error"
                  : "student-journal-content-help"
              }
            />
            <p id="student-journal-content-help" className={tw("issa-control-helper text-issa-muted")}>
              Tulis pengamatan faktual dalam 3–1500 karakter.
            </p>
            {errors.content && (
              <p id="student-journal-content-error" className={tw("issa-control-error text-issa-danger font-semibold")}>
                {errors.content}
              </p>
            )}
          </div>
        </div>

        <div className={tw("journal-entry-form__actions flex flex-wrap items-center gap-2 border-t border-issa-border p-4 max-sm:[&>.issa-button]:w-full")}>
          <PrimaryButton type="submit" disabled={submitting || readOnly}>
            {submitting
              ? "Menyimpan..."
              : editing
                ? "Simpan koreksi"
                : "Simpan catatan"}
          </PrimaryButton>
          {editing && (
            <SecondaryButton type="button" onClick={handleCancel} disabled={submitting}>
              Batal koreksi
            </SecondaryButton>
          )}
          <p
            className={tw("journal-entry-form__status min-w-0 [flex:1_1_14rem] text-issa-muted text-supporting")}
            role="status"
            aria-live="polite"
          >
            {demoReadOnly
              ? statusMessage
              : readOnly
                ? "Mode offline · catatan hanya dapat dibaca."
                : statusMessage}
          </p>
        </div>
      </form>
    </Surface>
  );
}
