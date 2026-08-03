import { tw } from "../shared/ui/tw";
import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  applyAttendanceLocalConflict,
  discardAttendanceMutation,
  retryAttendanceMutation,
  useAttendanceServerConflict,
} from "./attendanceOffline";
import {
  DestructiveButton,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
} from "../shared/ui/ui";

function formatServerUpdate(timestamp) {
  if (!timestamp) return "Waktu update tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function AttendanceSyncReview({ workspace }) {
  const [activeConflict, setActiveConflict] = useState(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const attendanceConflicts = workspace.conflicts.filter((record) => (
    record.mutation?.type === "attendance.update"
  ));
  const failedAttendances = workspace.failedMutations.filter((mutation) => (
    mutation.type === "attendance.update"
  ));

  const finishAction = async (action, { syncAfter = false } = {}) => {
    setWorking(true);
    setActionError("");
    try {
      await action();
      await workspace.refreshStatus();
      setActiveConflict(null);
      if (syncAfter && workspace.onlineHint) {
        await workspace.syncNow();
      }
    } catch (error) {
      setActionError(
        error.message || "Tindakan belum dapat diproses. Coba kembali."
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      {attendanceConflicts.length > 0 && (
        <section
          className={tw("offline-status__review-list mt-3 border-t border-issa-border pt-3")}
          aria-label="Konflik attendance"
        >
          <h3 className={tw("text-label font-bold text-issa-text")}>Attendance perlu ditinjau</h3>
          {attendanceConflicts.map((record) => (
            <div className={tw("mt-2 grid gap-2 rounded-control border border-issa-border bg-issa-subtle p-3")} key={record.clientMutationId}>
              <p className={tw("text-supporting font-semibold text-issa-text")}>{record.mutation.payload.attendanceDate}</p>
              <SecondaryButton
                type="button"
                compact
                onClick={() => {
                  setActionError("");
                  setActiveConflict(record);
                }}
              >
                Tinjau konflik
              </SecondaryButton>
            </div>
          ))}
        </section>
      )}

      {failedAttendances.length > 0 && (
        <section
          className={tw("offline-status__review-list mt-3 border-t border-issa-border pt-3")}
          aria-label="Attendance gagal disinkronkan"
        >
          <h3 className={tw("text-label font-bold text-issa-text")}>Attendance gagal disinkronkan</h3>
          {failedAttendances.map((mutation) => (
            <div className={tw("mt-2 grid gap-2 rounded-control border border-issa-border bg-issa-subtle p-3")} key={mutation.clientMutationId}>
              <p className={tw("text-supporting font-semibold text-issa-text")}>
                {mutation.payload.attendanceDate}
                <span className={tw("mt-1 block text-metadata font-normal leading-normal text-issa-danger")}>{mutation.lastErrorMessage}</span>
              </p>
              <span className={tw("offline-status__review-actions flex flex-wrap gap-2")}>
                <PrimaryButton
                  type="button"
                  compact
                  disabled={working}
                  onClick={() => finishAction(
                    () => retryAttendanceMutation(mutation),
                    { syncAfter: true }
                  )}
                >
                  Coba lagi
                </PrimaryButton>
                <DestructiveButton
                  type="button"
                  compact
                  disabled={working}
                  onClick={() => finishAction(
                    () => discardAttendanceMutation(mutation)
                  )}
                >
                  Buang perubahan lokal
                </DestructiveButton>
              </span>
            </div>
          ))}
        </section>
      )}

      <Dialog
        open={Boolean(activeConflict)}
        onClose={() => {
          if (!working) setActiveConflict(null);
        }}
      >
        <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
        <div className={tw("issa-dialog-container fixed z-dialog inset-0 grid place-items-center overflow-y-auto p-4")}>
          <DialogPanel className={tw("issa-dialog-panel [width:min(32rem,_100%)] overflow-hidden border border-issa-border-strong rounded-dialog bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both] offline-conflict-dialog overflow-hidden")}>
            <div className={tw("offline-conflict-dialog__header border-b border-issa-border p-4")}>
              <DialogTitle className={tw("text-section-title font-bold leading-tight text-issa-text")}>Konflik attendance</DialogTitle>
              <p className={tw("mt-2 text-body leading-normal text-issa-muted")}>
                Data server berubah setelah workspace terakhir disimpan.
                Pilih data yang ingin digunakan.
              </p>
            </div>
            {activeConflict && (
              <div className={tw("offline-conflict-dialog__body p-4")}>
                <dl className={tw("grid gap-3 sm:grid-cols-2")}>
                  <div className={tw("rounded-control border border-issa-border bg-issa-subtle p-3")}>
                    <dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Tanggal kehadiran</dt>
                    <dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{activeConflict.conflict.local.attendanceDate}</dd>
                  </div>
                  <div className={tw("rounded-control border border-issa-border bg-issa-subtle p-3")}>
                    <dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Perubahan di perangkat</dt>
                    <dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{activeConflict.conflict.local.status}</dd>
                  </div>
                  <div className={tw("rounded-control border border-issa-border bg-issa-subtle p-3")}>
                    <dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Data terbaru di server</dt>
                    <dd className={tw("mt-1 text-body font-semibold text-issa-text")}>{activeConflict.conflict.server.status}</dd>
                  </div>
                  <div className={tw("rounded-control border border-issa-border bg-issa-subtle p-3")}>
                    <dt className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>Update server</dt>
                    <dd className={tw("mt-1 text-body font-semibold text-issa-text")}>
                      {formatServerUpdate(
                        activeConflict.conflict.server.updatedAt
                      )}
                    </dd>
                  </div>
                </dl>
                {actionError && (
                  <p
                    className={tw("offline-conflict-dialog__error mt-3 text-supporting font-semibold text-issa-danger")}
                    role="alert"
                    aria-live="assertive"
                  >
                    {actionError}
                  </p>
                )}
              </div>
            )}
            <div className={tw("offline-conflict-dialog__actions flex flex-wrap justify-end gap-2 border-t border-issa-border p-4 max-sm:[&>button]:w-full")}>
              <SecondaryButton
                type="button"
                disabled={working}
                onClick={() => finishAction(
                  () => useAttendanceServerConflict(activeConflict)
                )}
              >
                Gunakan data server
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={working}
                onClick={() => finishAction(
                  () => applyAttendanceLocalConflict(activeConflict),
                  { syncAfter: true }
                )}
              >
                Terapkan perubahan saya
              </PrimaryButton>
              <TertiaryButton
                type="button"
                disabled={working}
                onClick={() => setActiveConflict(null)}
              >
                Tinjau nanti
              </TertiaryButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
