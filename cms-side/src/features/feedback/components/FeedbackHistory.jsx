import isEmpty from "lodash/isEmpty";
import { formatRecordedDate } from "../../../utils/recordDates";
import { LedgerShell } from "../../../shared/ui/ui";

export default function FeedbackHistory({ resource, onRetry }) {
  const empty = !resource.loading
    && !resource.error
    && isEmpty(resource.data);

  return (
    <LedgerShell
      className="feedback-history"
      eyebrow="Feedback register"
      title="Histori Feedback"
      description="Catatan terbaru ditampilkan lebih dahulu dan tidak tertukar dengan draf."
      loading={resource.loading}
      loadingLabel="Memuat histori feedback..."
      error={resource.error}
      onRetry={onRetry}
      empty={empty}
      emptyTitle="Belum ada histori Feedback."
      emptyDescription="Feedback pertama akan tercatat setelah guru menyimpannya."
    >
      {!resource.loading && !resource.error && !empty && (
        <ol className="feedback-history__list">
          {resource.data.map((item) => (
            <li key={item.id} className="feedback-history__entry">
              <p className="feedback-history__content">{item.content}</p>
              <dl className="feedback-history__metadata">
                <div>
                  <dt>Guru</dt>
                  <dd>{item.Teacher?.name || "-"}</dd>
                </div>
                <div>
                  <dt>Observasi</dt>
                  <dd>{formatRecordedDate(item.observedAt, "Belum tersedia")}</dd>
                </div>
                <div>
                  <dt>Disimpan</dt>
                  <dd>{formatRecordedDate(item.createdAt)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </LedgerShell>
  );
}
