import { tw } from "../../../shared/ui/tw";
import { nativeControlClasses } from "../../../shared/ui/form-controls/controlStyles";
import {
  FormField,
  InlineNotice,
  LedgerShell,
  PrimaryButton,
  SecondaryButton,
} from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";

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
      className={tw("feedback-editor")}
      eyebrow="Final teacher record"
      title="Catat Feedback"
      description="Isi tetap menjadi catatan guru dan baru dibagikan setelah disimpan."
      actions={onAiDraftRequested && (
        <div className={tw("feedback-editor__ai-action grid justify-items-end gap-1 max-sm:w-full max-sm:[justify-items:stretch]")}>
          <span className={tw("text-issa-muted text-metadata")}>Opsional · AI-assisted draft</span>
          <SecondaryButton type="button" onClick={onAiDraftRequested}>
            Buat draft dengan AI
          </SecondaryButton>
        </div>
      )}
    >
      <form onSubmit={onSubmit} className={tw("feedback-editor__form grid min-w-0 gap-4 p-4")}>
        <FormField
          label="Feedback guru"
          hint="Tinjau isi secara menyeluruh sebelum menyimpan."
        >
          <textarea
            ref={feedbackInputRef}
            id="feedback"
            value={feedback}
            onChange={onFeedbackChange}
            className={tw(nativeControlClasses, "issa-native-control--textarea feedback-editor__textarea min-h-52 max-w-full resize-y px-3 py-2 leading-[1.55] [overflow-wrap:anywhere]")}
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
        <div className={tw("feedback-editor__actions grid gap-3 border-t border-issa-border pt-4 [&>.issa-button]:justify-self-start max-sm:[&>.issa-button]:w-full")}>
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
