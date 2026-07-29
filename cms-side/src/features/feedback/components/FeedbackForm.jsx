import {
  FormField,
  InlineNotice,
  LedgerShell,
  PrimaryButton,
  SecondaryButton,
} from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";
import "../feedback-workspace.css";

export default function FeedbackForm({
  feedback,
  feedbackInputRef,
  isDemo = false,
  observedAt,
  message,
  submitting,
  onAiDraftRequested,
  onFeedbackChange,
  onObservedAtChange,
  onSubmit,
}) {
  const messageTone = message?.toLowerCase().includes("berhasil")
    ? "success"
    : /(gagal|tidak valid|tidak boleh)/i.test(message || "")
      ? "danger"
      : "info";

  return (
    <LedgerShell
      className="feedback-editor"
      eyebrow="Final teacher record"
      title="Catat Feedback"
      description="Isi tetap menjadi catatan guru dan baru dibagikan setelah disimpan."
      actions={onAiDraftRequested && (
        <div className="feedback-editor__ai-action">
          <span>Opsional · AI-assisted draft</span>
          <SecondaryButton type="button" onClick={onAiDraftRequested}>
            Buat draft dengan AI
          </SecondaryButton>
        </div>
      )}
    >
      <form onSubmit={onSubmit} className="feedback-editor__form">
        <FormField
          label="Feedback guru"
          hint="Tinjau isi secara menyeluruh sebelum menyimpan."
        >
          <textarea
            ref={feedbackInputRef}
            id="feedback"
            value={feedback}
            onChange={onFeedbackChange}
            className="issa-native-control issa-native-control--textarea feedback-editor__textarea"
            rows="8"
          />
        </FormField>
        <DateTimeField
          id="observedAt"
          label="Tanggal observasi"
          value={observedAt}
          onChange={onObservedAtChange}
          optional
        />
        <div className="feedback-editor__actions">
          <PrimaryButton type="submit" disabled={submitting || isDemo}>
            {submitting ? "Menyimpan..." : "Simpan Feedback"}
          </PrimaryButton>
          {isDemo && (
            <InlineNotice tone="warning" role="note">
              Draft AI belum disimpan. Penyimpanan dinonaktifkan dalam mode demo.
            </InlineNotice>
          )}
          {message && (
            <InlineNotice tone={messageTone}>{message}</InlineNotice>
          )}
        </div>
      </form>
    </LedgerShell>
  );
}
