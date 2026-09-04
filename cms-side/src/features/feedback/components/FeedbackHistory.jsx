import { tw } from "../../../shared/ui/tw";
import { formatRecordedDate } from "../../../utils/recordDates";
import { LedgerShell, InlineNotice } from "../../../shared/ui/ui";
import { RESOURCE_STATUS } from "../../../shared/data/resourceTruth";

export default function FeedbackHistory({ resource, onRetry }) {
  const data = Array.isArray(resource?.data) ? resource.data : [];
  const loading = resource?.status === RESOURCE_STATUS.LOADING;
  const error = resource?.status === RESOURCE_STATUS.ERROR ? resource.error : "";
  const empty = resource?.status === RESOURCE_STATUS.EMPTY;
  const partial = resource?.status === RESOURCE_STATUS.PARTIAL;
  const unavailable = resource?.status === RESOURCE_STATUS.UNAVAILABLE;

  return (
    <LedgerShell
      className={tw("feedback-history")}
      eyebrow="Riwayat"
      title="Feedback guru"
      description="Feedback tersimpan ditampilkan dari yang terbaru; draf belum termasuk di sini."
      loading={loading}
      loadingLabel="Memuat histori feedback..."
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyTitle="Belum ada histori feedback."
      emptyDescription="Feedback pertama akan tercatat setelah guru menyimpannya."
    >
      {unavailable && (
        <InlineNotice className={tw("my-4")} tone="warning" role="note">
          {resource.reason || "Histori feedback tidak tersedia dalam konteks data ini."}
        </InlineNotice>
      )}
      {partial && (
        <InlineNotice className={tw("my-4")} tone="warning" role="note">
          {resource.reason || "Histori feedback yang tersedia mungkin tidak lengkap."}
        </InlineNotice>
      )}
      {[RESOURCE_STATUS.KNOWN, RESOURCE_STATUS.PARTIAL].includes(resource?.status) && data.length > 0 && (
        <ol className={tw("feedback-history__list m-0 p-0 list-none")}>
          {data.map((item) => (
            <li key={item.id} className={tw("feedback-history__entry py-4 [&+&]:border-t [&+&]:border-issa-border")}>
              <p className={tw("feedback-history__content [max-width:68ch] text-issa-text text-body leading-normal [overflow-wrap:anywhere] whitespace-pre-wrap")}>{item.content}</p>
              <dl className={tw("feedback-history__metadata flex min-w-0 flex-wrap [gap:var(--issa-space-3)_var(--issa-space-4)] mt-3 [&_dt]:text-issa-muted [&_dt]:text-metadata [&_dt]:font-semibold [&_dt]:tracking-normal [&_dd]:mt-1 [&_dd]:text-issa-muted [&_dd]:text-metadata [&_dd]:[overflow-wrap:anywhere]")}>
                <div>
                  <dt>Guru</dt>
                  <dd>{item.Teacher?.name || "-"}</dd>
                </div>
                <div>
                  <dt>Tanggal konteks</dt>
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
