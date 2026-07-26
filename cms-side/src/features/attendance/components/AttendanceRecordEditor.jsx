import SelectField from "../../../shared/ui/form-controls/SelectField";
import { StatusBadge } from "../../../shared/ui/ui";
import {
  attendanceStatuses,
  attendanceSyncLabels,
} from "../../../offline-workspace/attendanceOffline";
import "../attendance-offline.css";

const attendanceStatusOptions = attendanceStatuses.map((status) => ({
  value: status,
  label: status,
  tone: {
    Hadir: "success",
    Sakit: "warning",
    Izin: "warning",
    Alfa: "danger",
  }[status],
}));

export default function AttendanceRecordEditor({
  record,
  saving = false,
  onChange,
}) {
  const isLocked = record.syncState === "syncing"
    || record.syncState === "conflict";
  const statusLabel = attendanceSyncLabels[record.syncState]
    || attendanceSyncLabels.synced;

  return (
    <div
      className="attendance-offline-record record-ledger__entry rounded-xl border p-3"
      data-sync-state={record.syncState}
    >
      <div className="attendance-offline-record__heading">
        <span className="text-sm font-medium text-[var(--text)]">
          {record.attendanceDate || "Tanggal attendance belum tersedia"}
        </span>
        <StatusBadge status={record.status} />
      </div>
      <SelectField
        id={`student-attendance-${record.id}`}
        label={`Status kehadiran ${record.attendanceDate}`}
        value={record.status}
        onChange={(status) => onChange(record, status)}
        disabled={saving || isLocked}
        options={attendanceStatusOptions}
        tone="attendance"
      />
      <p
        className="attendance-offline-record__sync-label"
        data-state={record.syncState}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {record.syncState === "synced" ? "cloud_done" : "schedule"}
        </span>
        {saving ? "Menyimpan di perangkat" : statusLabel}
      </p>
      {record.syncErrorMessage && (
        <p className="attendance-offline-record__error" role="alert">
          {record.syncErrorMessage}
        </p>
      )}
    </div>
  );
}
