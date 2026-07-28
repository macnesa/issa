import { FormField, PrimaryButton, SecondaryButton, Surface } from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";
import "./Feedback.css";

export default function FeedbackForm({ feedback, feedbackInputRef, observedAt, message, submitting, onAiDraftRequested, onFeedbackChange, onObservedAtChange, onSubmit }) {
  return (
    <Surface className="observation-sheet observation-sheet--entry">
      <header className="observation-sheet__header">
        <div>
          <p className="observation-sheet__kicker">Final teacher record</p>
          <h3>Catat Feedback</h3>
          <span>Isi di bawah tetap menjadi catatan guru dan baru dibagikan setelah disimpan.</span>
        </div>
        {onAiDraftRequested && (
          <div className="observation-sheet__ai-action">
            <span>Opsional · AI-assisted draft</span>
            <SecondaryButton type="button" onClick={onAiDraftRequested}>
              Susun draf dari record
            </SecondaryButton>
          </div>
        )}
      </header>
      <form onSubmit={onSubmit} className="observation-sheet__form">
        <FormField
          label="Feedback guru"
          hint="Tinjau isi secara menyeluruh sebelum menyimpan."
        >
          <textarea
            ref={feedbackInputRef}
            id="feedback"
            value={feedback}
            onChange={onFeedbackChange}
            className="issa-native-control issa-native-control--textarea observation-sheet__editor"
            rows="8"
          />
        </FormField>
        <DateTimeField
          id="observedAt"
          label="Tanggal observasi"
          value={observedAt}
          onChange={onObservedAtChange}
          optional
          tone="feedback"
        />
        <div className="observation-sheet__actions">
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Feedback"}
          </PrimaryButton>
          <p
            role="status"
            aria-live="polite"
            className="observation-sheet__status"
            data-state={
              message?.toLowerCase().includes("berhasil")
                ? "success"
                : /(gagal|tidak valid|tidak boleh)/i.test(message || "")
                  ? "error"
                  : message
                    ? "notice"
                    : "idle"
            }
          >
            {message}
          </p>
        </div>
      </form>
    </Surface>
  );
}
