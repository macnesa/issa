import { FormField, PrimaryButton, SecondaryButton, Surface } from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";

export default function FeedbackForm({ feedback, feedbackInputRef, observedAt, message, submitting, onAiDraftRequested, onFeedbackChange, onObservedAtChange, onSubmit }) {
  return (
    <Surface className="observation-sheet observation-sheet--entry p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-[var(--text)]">Catat feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Tambahkan catatan terbaru untuk rekam perkembangan siswa.</p></div>{onAiDraftRequested && <SecondaryButton type="button" onClick={onAiDraftRequested}>Susun draf perkembangan</SecondaryButton>}</div><form onSubmit={onSubmit} className="mt-5 space-y-4"><FormField label="Feedback"><textarea ref={feedbackInputRef} id="feedback" value={feedback} onChange={onFeedbackChange} className="issa-native-control issa-native-control--textarea" rows="5" /></FormField><DateTimeField id="observedAt" label="Tanggal observasi" value={observedAt} onChange={onObservedAtChange} optional tone="feedback" /><div className="flex flex-wrap items-center gap-3"><PrimaryButton type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan feedback"}</PrimaryButton>{message && <p role="status" className="text-sm text-[var(--muted)]">{message}</p>}</div></form></Surface>
  );
}
