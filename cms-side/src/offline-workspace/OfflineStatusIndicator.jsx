import { tw } from "../shared/ui/tw";
import { useOfflineWorkspace } from "./OfflineWorkspaceProvider";
import AttendanceSyncReview from "./AttendanceSyncReview";
import { PrimaryButton } from "../shared/ui/ui";
import Icon from "../shared/ui/Icon";

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
      className={tw("offline-status relative [z-index:1] flex min-w-0 max-w-full flex-none justify-end lg:w-full")}
      data-online={workspace.connectionAvailable ? "true" : "false"}
      aria-label="Status sinkronisasi workspace"
    >
      <details className={tw("offline-status__details group relative lg:w-full")}>
        <summary className={tw("offline-status__summary inline-flex min-h-control cursor-pointer list-none items-center gap-2 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-2 text-status font-bold text-issa-text transition-colors duration-default marker:hidden hover:border-issa-accent hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus motion-reduce:transition-none [&::-webkit-details-marker]:hidden lg:w-full")}>
          <span className={tw("flex min-w-0 items-center gap-2")}>
            <span className={tw("offline-status__signal h-[0.52rem] w-[0.52rem] flex-none rounded-full border-emphasis border-[color-mix(in_srgb,var(--issa-text)_18%,transparent)]", workspace.connectionAvailable ? "bg-issa-success" : "bg-issa-warning")} aria-hidden="true" />
            <span>{statusLabel}</span>
          </span>
          <Icon className={tw("ml-auto flex-none transition-transform duration-default group-open:rotate-180 motion-reduce:transition-none")} name="expand_more" />
        </summary>
        <div className={tw("offline-status__panel absolute right-0 top-[calc(100%_+_var(--issa-space-2))] w-[min(21rem,calc(100vw_-_2rem))] max-w-[calc(100vw_-_1.75rem)] rounded-dialog border border-issa-border-strong bg-issa-surface p-4 text-issa-text shadow-dialog lg:bottom-[calc(100%_+_var(--issa-space-2))] lg:left-0 lg:right-auto lg:top-auto max-sm:left-0 max-sm:right-auto")}>
          <dl className={tw("grid grid-cols-2 gap-x-4 gap-y-2")}>
            <div className={tw("border-b border-issa-border pb-2")}><dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Koneksi</dt><dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{workspace.connectionAvailable ? "Online" : "Offline"}</dd></div>
            <div className={tw("border-b border-issa-border pb-2")}><dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Menunggu</dt><dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{workspace.pendingCount}</dd></div>
            <div className={tw("border-b border-issa-border pb-2")}><dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Perlu ditinjau</dt><dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{workspace.conflictCount}</dd></div>
            <div className={tw("border-b border-issa-border pb-2")}><dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Gagal</dt><dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{workspace.failedCount}</dd></div>
          </dl>
          <p className={tw("mt-3 text-supporting leading-normal text-issa-muted")}>Sinkronisasi terakhir: {formatLastSync(workspace.lastSuccessfulSyncAt)}</p>
          {workspace.authRequired && (
            <p className={tw("offline-status__notice mt-3 border-l-emphasis border-issa-warning bg-[color-mix(in_srgb,var(--issa-warning)_8%,var(--issa-surface))] px-3 py-2 text-supporting leading-normal text-issa-warning")}>
              Sesi perlu diperiksa kembali saat koneksi tersedia.
            </p>
          )}
          <PrimaryButton
            className={tw("mt-3 w-full")}
            type="button"
            onClick={() => workspace.syncNow()}
            disabled={
              workspace.isDemo
              || !workspace.onlineHint
              || workspace.syncRunning
            }
          >
            Sinkronkan sekarang
          </PrimaryButton>
          {workspace.isDemo && (
            <small className={tw("mt-2 block text-metadata leading-normal text-issa-muted")}>Tidak tersedia dalam mode demo.</small>
          )}
          <AttendanceSyncReview workspace={workspace} />
          {hasReviewItems && (
            <small className={tw("mt-2 block text-metadata leading-normal text-issa-muted")}>
              Item gagal atau konflik tidak dikirim ulang otomatis.
            </small>
          )}
        </div>
      </details>
    </aside>
  );
}

export { primaryStatus };
