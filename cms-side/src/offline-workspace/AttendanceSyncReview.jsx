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
          className="offline-status__review-list"
          aria-label="Konflik attendance"
        >
          <h3>Attendance perlu ditinjau</h3>
          {attendanceConflicts.map((record) => (
            <div key={record.clientMutationId}>
              <p>{record.mutation.payload.attendanceDate}</p>
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
          className="offline-status__review-list"
          aria-label="Attendance gagal disinkronkan"
        >
          <h3>Attendance gagal disinkronkan</h3>
          {failedAttendances.map((mutation) => (
            <div key={mutation.clientMutationId}>
              <p>
                {mutation.payload.attendanceDate}
                <span>{mutation.lastErrorMessage}</span>
              </p>
              <span className="offline-status__review-actions">
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
        <DialogBackdrop className="issa-dialog-backdrop" />
        <div className="issa-dialog-container">
          <DialogPanel className="issa-dialog-panel offline-conflict-dialog">
            <div className="offline-conflict-dialog__header">
              <DialogTitle>Konflik attendance</DialogTitle>
              <p>
                Data server berubah setelah workspace terakhir disimpan.
                Pilih data yang ingin digunakan.
              </p>
            </div>
            {activeConflict && (
              <div className="offline-conflict-dialog__body">
                <dl>
                  <div>
                    <dt>Tanggal kehadiran</dt>
                    <dd>{activeConflict.conflict.local.attendanceDate}</dd>
                  </div>
                  <div>
                    <dt>Perubahan di perangkat</dt>
                    <dd>{activeConflict.conflict.local.status}</dd>
                  </div>
                  <div>
                    <dt>Data terbaru di server</dt>
                    <dd>{activeConflict.conflict.server.status}</dd>
                  </div>
                  <div>
                    <dt>Update server</dt>
                    <dd>
                      {formatServerUpdate(
                        activeConflict.conflict.server.updatedAt
                      )}
                    </dd>
                  </div>
                </dl>
                {actionError && (
                  <p
                    className="offline-conflict-dialog__error"
                    role="alert"
                    aria-live="assertive"
                  >
                    {actionError}
                  </p>
                )}
              </div>
            )}
            <div className="offline-conflict-dialog__actions">
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
