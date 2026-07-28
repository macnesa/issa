import isEmpty from "lodash/isEmpty";
import { formatRecordedDate } from "../../../utils/recordDates";
import { EmptyState, ErrorState, LoadingState, Surface } from "../../../shared/ui/ui";

export default function FeedbackHistory({ resource, onRetry }) {
  return (
    <Surface className="min-w-0 overflow-hidden !border-2 !border-[#d8c985] !rounded-[0.25rem_var(--surface-radius)_0.25rem_0.25rem] !bg-[#fffdf7]">
      <header className="flex min-w-0 items-start justify-between gap-4 border-b border-[#d8c985] bg-[#fff4c6] px-[1.1rem] py-4">
        <div className="min-w-0">
          <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[#745d1e]">
            Feedback register
          </p>
          <h3 className="mt-1 text-[1.08rem] font-[820] text-[var(--text)]">
            Histori Feedback
          </h3>
          <span className="mt-[0.35rem] block max-w-[54ch] text-[0.78rem] leading-6 text-[#655d47]">
            Catatan terbaru ditampilkan lebih dahulu sebagai record yang tidak tertukar dengan draf.
          </span>
        </div>
      </header>
      <div className="min-w-0 px-[1.1rem] pb-[1.1rem]">
        {resource.loading && (
          <div className="mt-4">
            <LoadingState label="Memuat histori feedback..." />
          </div>
        )}
        {resource.error && (
          <div className="mt-4">
            <ErrorState message={resource.error} onRetry={onRetry} />
          </div>
        )}
        {!resource.loading && !resource.error && isEmpty(resource.data) && (
          <div className="mt-4">
            <EmptyState
              title="Belum ada histori Feedback."
              description="Feedback pertama akan tercatat setelah guru menyimpannya."
            />
          </div>
        )}
        {!resource.loading && !resource.error && !isEmpty(resource.data) && (
          <ol className="m-0 list-none p-0">
            {resource.data.map((item, index) => (
              <li
                key={item.id}
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] border-b border-[#e2d8aa] py-4"
              >
                <span
                  className="text-[0.66rem] font-[850] tracking-[0.08em] text-[#8a7b50]"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="m-0 max-w-[68ch] whitespace-pre-wrap text-[0.86rem] leading-[1.65] text-[var(--text)] [overflow-wrap:anywhere]">
                    {item.content}
                  </p>
                  <dl className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-[0.65rem]">
                    <div className="min-w-0">
                      <dt className="text-[0.6rem] font-extrabold uppercase tracking-[0.08em] text-[#7e745b]">
                        Guru
                      </dt>
                      <dd className="mt-[0.12rem] text-[0.7rem] text-[var(--muted)] [overflow-wrap:anywhere]">
                        {item.Teacher?.name || "-"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[0.6rem] font-extrabold uppercase tracking-[0.08em] text-[#7e745b]">
                        Observasi
                      </dt>
                      <dd className="mt-[0.12rem] text-[0.7rem] text-[var(--muted)] [overflow-wrap:anywhere]">
                        {formatRecordedDate(item.observedAt, "Belum tersedia")}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[0.6rem] font-extrabold uppercase tracking-[0.08em] text-[#7e745b]">
                        Disimpan
                      </dt>
                      <dd className="mt-[0.12rem] text-[0.7rem] text-[var(--muted)] [overflow-wrap:anywhere]">
                        {formatRecordedDate(item.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Surface>
  );
}
