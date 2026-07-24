import isEmpty from "lodash/isEmpty";
import { formatRecordedDate } from "../../../utils/recordDates";
import { EmptyState, ErrorState, LoadingState, Surface } from "../../../shared/ui/ui";

export default function FeedbackHistory({ resource, onRetry }) {
  return (
    <Surface className="observation-sheet observation-sheet--history p-5"><h2 className="text-lg font-semibold text-[var(--text)]">Histori feedback</h2><p className="mt-1 text-sm text-[var(--muted)]">Catatan terbaru ditampilkan lebih dahulu.</p><div className="mt-4">{resource.loading && <LoadingState label="Memuat histori feedback..." />}{resource.error && <ErrorState message={resource.error} onRetry={onRetry} />}{!resource.loading && !resource.error && isEmpty(resource.data) && <EmptyState title="Belum ada histori feedback." />}{!resource.loading && !resource.error && !isEmpty(resource.data) && <ol className="space-y-3">{resource.data.map((item) => <li key={item.id} className="rounded-xl border border-[var(--border)] p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{item.content}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]"><span>Guru: {item.Teacher?.name || "-"}</span><span>Observasi: {formatRecordedDate(item.observedAt, "Belum tersedia")}</span><span>Dibuat: {formatRecordedDate(item.createdAt)}</span></div></li>)}</ol>}</div></Surface>
  );
}
