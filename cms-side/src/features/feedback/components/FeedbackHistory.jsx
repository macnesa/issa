import { tw } from "../../../shared/ui/tw";
import isEmpty from "lodash/isEmpty";
import { formatRecordedDate } from "../../../utils/recordDates";
import { LedgerShell } from "../../../shared/ui/ui";

export default function FeedbackHistory({ resource, onRetry }) {
  const empty = !resource.loading
    && !resource.error
    && isEmpty(resource.data);

  return (
    <LedgerShell
      className={tw("feedback-history")}
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
        <ol className={tw("feedback-history__list m-0 p-0 list-none")}>
          {resource.data.map((item) => (
            <li key={item.id} className={tw("feedback-history__entry p-4 [&+&]:border-t [&+&]:border-issa-border")}>
              <p className={tw("feedback-history__content [max-width:68ch] text-issa-text text-body leading-normal [overflow-wrap:anywhere] whitespace-pre-wrap")}>{item.content}</p>
              <dl className={tw("feedback-history__metadata flex min-w-0 flex-wrap [gap:var(--issa-space-3)_var(--issa-space-4)] mt-3 [&_dt]:text-issa-muted [&_dt]:text-metadata [&_dt]:font-bold [&_dt]:tracking-metadata [&_dt]:uppercase [&_dd]:mt-1 [&_dd]:text-issa-muted [&_dd]:text-metadata [&_dd]:[overflow-wrap:anywhere]")}>
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
