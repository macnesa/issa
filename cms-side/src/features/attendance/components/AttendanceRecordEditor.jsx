import { tw } from "../../../shared/ui/tw";
import Icon from "../../../shared/ui/Icon";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import { StatusBadge } from "../../../shared/ui/ui";
import {
  attendanceStatuses,
  attendanceSyncLabels,
} from "../../../offline-workspace/attendanceOffline";
import { formatDateDisplay } from "../../../utils/recordDates";

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
  readOnly = false,
  saving = false,
  onChange,
}) {
  const isLocked = record.syncState === "syncing"
    || record.syncState === "conflict";
  const statusLabel = attendanceSyncLabels[record.syncState]
    || attendanceSyncLabels.synced;
  const attendanceDateLabel = formatDateDisplay(record.attendanceDate)
    || "Tanggal kehadiran belum tersedia";

  return (
    <div
      className={tw("attendance-offline-record grid gap-3 border border-issa-border rounded-surface p-3 bg-issa-surface record-ledger__entry data-[sync-state=pending]:border-l-emphasis data-[sync-state=pending]:border-l-issa-warning data-[sync-state=syncing]:border-l-emphasis data-[sync-state=syncing]:border-l-issa-warning data-[sync-state=conflict]:border-l-emphasis data-[sync-state=conflict]:border-l-issa-danger data-[sync-state=failed]:border-l-emphasis data-[sync-state=failed]:border-l-issa-danger")}
      data-sync-state={record.syncState}
    >
      <div className={tw("attendance-offline-record__heading flex items-center justify-between gap-3")}>
        <span className={tw("text-issa-text text-body font-medium")}>
          {attendanceDateLabel}
        </span>
        <StatusBadge status={record.status} />
      </div>
      <SelectField
        id={`student-attendance-${record.id}`}
        label={`Status kehadiran ${attendanceDateLabel}`}
        value={record.status}
        onChange={(status) => {
          if (!readOnly) onChange(record, status);
        }}
        disabled={saving || isLocked || readOnly}
        options={attendanceStatusOptions}
      />
      {readOnly && (
        <p className={tw("attendance-offline-record__demo text-issa-muted text-metadata font-semibold")}>
          Tidak tersedia dalam mode demo.
        </p>
      )}
      <p
        className={tw("attendance-offline-record__sync-label inline-flex items-center gap-1 text-issa-muted text-metadata font-semibold data-[state=pending]:text-issa-warning data-[state=syncing]:text-issa-warning data-[state=conflict]:text-issa-danger data-[state=failed]:text-issa-danger")}
        data-state={record.syncState}
      >
        <Icon className={tw("text-section-title")} name={record.syncState === "synced" ? "cloud_done" : "schedule"} />
        {saving ? "Menyimpan di perangkat" : statusLabel}
      </p>
      {record.syncErrorMessage && (
        <p className={tw("attendance-offline-record__error text-issa-danger text-metadata leading-normal")} role="alert">
          {record.syncErrorMessage}
        </p>
      )}
    </div>
  );
}
