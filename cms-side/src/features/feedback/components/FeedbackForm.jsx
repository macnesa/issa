import { FormField, PrimaryButton, Surface } from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";

export default function FeedbackForm({ feedback, observedAt, message, submitting, onFeedbackChange, onObservedAtChange, onSubmit }) {
  return (
    <Surface className="observation-sheet observation-sheet--entry p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Catat feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Tambahkan catatan terbaru untuk rekam perkembangan siswa.</p><form onSubmit={onSubmit} className="mt-5 space-y-4"><FormField label="Feedback"><textarea id="feedback" value={feedback} onChange={onFeedbackChange} className="issa-native-control issa-native-control--textarea" rows="5" /></FormField><DateTimeField id="observedAt" label="Tanggal observasi" value={observedAt} onChange={onObservedAtChange} optional tone="feedback" /><div className="flex flex-wrap items-center gap-3"><PrimaryButton type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan feedback"}</PrimaryButton>{message && <p role="status" className="text-sm text-[var(--muted)]">{message}</p>}</div></form></Surface>
  );
}
