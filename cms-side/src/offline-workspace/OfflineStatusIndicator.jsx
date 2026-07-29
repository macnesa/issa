import { useOfflineWorkspace } from "./OfflineWorkspaceProvider";
import AttendanceSyncReview from "./AttendanceSyncReview";
import "./OfflineStatusIndicator.css";

function formatLastSync(timestamp) {
  if (!timestamp) return "Belum ada sinkronisasi";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function primaryStatus({
  onlineHint,
  connectionAvailable = onlineHint,
  syncRunning,
  pendingCount,
  failedCount,
  conflictCount,
}) {
  if (!connectionAvailable) return "Offline";
  if (syncRunning) return "Menyinkronkan…";
  if (conflictCount > 0) return `${conflictCount} perlu ditinjau`;
  if (failedCount > 0) return `${failedCount} gagal disinkronkan`;
  if (pendingCount > 0) return "Menunggu sinkronisasi";
  return "Online";
}

export default function OfflineStatusIndicator() {
  const workspace = useOfflineWorkspace();
  const statusLabel = primaryStatus(workspace);
  const hasReviewItems = workspace.failedCount > 0
    || workspace.conflictCount > 0;

  return (
    <aside
      className="offline-status"
      data-online={workspace.connectionAvailable ? "true" : "false"}
      aria-label="Status sinkronisasi workspace"
    >
      <details>
        <summary>
          <span className="offline-status__signal" aria-hidden="true" />
          <span>{statusLabel}</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            expand_more
          </span>
        </summary>
        <div className="offline-status__panel">
          <dl>
            <div><dt>Koneksi</dt><dd>{workspace.connectionAvailable ? "Online" : "Offline"}</dd></div>
            <div><dt>Menunggu</dt><dd>{workspace.pendingCount}</dd></div>
            <div><dt>Perlu ditinjau</dt><dd>{workspace.conflictCount}</dd></div>
            <div><dt>Gagal</dt><dd>{workspace.failedCount}</dd></div>
          </dl>
          <p>Sinkronisasi terakhir: {formatLastSync(workspace.lastSuccessfulSyncAt)}</p>
          {workspace.authRequired && (
            <p className="offline-status__notice">
              Sesi perlu diperiksa kembali saat koneksi tersedia.
            </p>
          )}
          <button
            type="button"
            onClick={() => workspace.syncNow()}
            disabled={
              workspace.isDemo
              || !workspace.onlineHint
              || workspace.syncRunning
            }
          >
            Sinkronkan sekarang
          </button>
          {workspace.isDemo && (
            <small>Tidak tersedia dalam mode demo.</small>
          )}
          <AttendanceSyncReview workspace={workspace} />
          {hasReviewItems && (
            <small>
              Item gagal atau konflik tidak dikirim ulang otomatis.
            </small>
          )}
        </div>
      </details>
    </aside>
  );
}

export { primaryStatus };
