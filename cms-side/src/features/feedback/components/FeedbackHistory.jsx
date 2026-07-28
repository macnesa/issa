import isEmpty from "lodash/isEmpty";
import { formatRecordedDate } from "../../../utils/recordDates";
import { EmptyState, ErrorState, LoadingState, Surface } from "../../../shared/ui/ui";
import "./Feedback.css";

export default function FeedbackHistory({ resource, onRetry }) {
  return (
    <Surface className="observation-sheet observation-sheet--history">
      <header className="observation-sheet__header">
        <div>
          <p className="observation-sheet__kicker">Feedback register</p>
          <h3>Histori Feedback</h3>
          <span>Catatan terbaru ditampilkan lebih dahulu sebagai record yang tidak tertukar dengan draf.</span>
        </div>
      </header>
      <div className="observation-sheet__history-body">
        {resource.loading && <LoadingState label="Memuat histori feedback..." />}
        {resource.error && <ErrorState message={resource.error} onRetry={onRetry} />}
        {!resource.loading && !resource.error && isEmpty(resource.data) && (
          <EmptyState
            title="Belum ada histori Feedback."
            description="Feedback pertama akan tercatat setelah guru menyimpannya."
          />
        )}
        {!resource.loading && !resource.error && !isEmpty(resource.data) && (
          <ol className="observation-sheet__history-list">
            {resource.data.map((item, index) => (
              <li key={item.id}>
                <span className="observation-sheet__history-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p>{item.content}</p>
                  <dl>
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
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Surface>
  );
}
