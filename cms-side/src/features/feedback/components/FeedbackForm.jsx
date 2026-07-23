import { FormField, PrimaryButton, Surface } from "../../../shared/ui/ui";

export default function FeedbackForm({ feedback, observedAt, message, submitting, onFeedbackChange, onObservedAtChange, onSubmit }) {
  return (
    <Surface className="p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Catat feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Tambahkan catatan terbaru untuk rekam perkembangan siswa.</p><form onSubmit={onSubmit} className="mt-5 space-y-4"><FormField label="Feedback"><textarea id="feedback" value={feedback} onChange={onFeedbackChange} className="min-h-32 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" rows="5" /></FormField><FormField label="Tanggal observasi" hint="Opsional"><input id="observedAt" type="datetime-local" value={observedAt} onChange={onObservedAtChange} onInput={onObservedAtChange} className="min-h-10 w-full rounded-lg border border-[var(--border-strong)] px-3 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" /></FormField><div className="flex flex-wrap items-center gap-3"><PrimaryButton type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan feedback"}</PrimaryButton>{message && <p role="status" className="text-sm text-[var(--muted)]">{message}</p>}</div></form></Surface>
  );
}
