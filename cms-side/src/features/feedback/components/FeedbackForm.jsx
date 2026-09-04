import { tw } from "../../../shared/ui/tw";
import { Textarea } from "flowbite-react/components/Textarea";
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
      eyebrow="Catatan guru"
      title="Catat feedback"
      description="Isi tetap menjadi catatan guru dan baru dibagikan setelah disimpan."
      actions={onAiDraftRequested && (
        <div className={tw("feedback-editor__ai-action grid justify-items-end gap-1 max-sm:w-full max-sm:[justify-items:stretch]")}>
          <span className={tw("text-issa-muted text-metadata")}>Opsional · Draf berbantuan AI</span>
          <SecondaryButton type="button" onClick={onAiDraftRequested}>
            Buat draf dengan AI
          </SecondaryButton>
        </div>
      )}
    >
      <form onSubmit={onSubmit} className={tw("feedback-editor__form grid min-w-0 gap-4 py-5")}>
        <FormField
          label="Feedback guru"
          hint="Tinjau isi secara menyeluruh sebelum menyimpan."
        >
          <Textarea
            ref={feedbackInputRef}
            id="feedback"
            value={feedback}
            onChange={onFeedbackChange}
            className={tw("feedback-editor__textarea !min-h-52 max-w-full resize-y leading-[1.55] [overflow-wrap:anywhere]")}
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
            {submitting ? "Menyimpan..." : "Simpan feedback"}
          </PrimaryButton>
          {isDemo && (
            <InlineNotice tone="warning" role="note">
              Draf AI belum disimpan. Penyimpanan dinonaktifkan dalam mode demo.
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
