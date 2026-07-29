import { useState } from "react";
import { useDispatch } from "react-redux";
import { createAttendanceRecord } from "../../../store/action/ActionCreator";
import ModalAttendances from "./ModalAttendances";
import { StatusBadge } from "../../../shared/ui/ui";
import SelectField from "../../../shared/ui/form-controls/SelectField";
import {
  attendanceSyncLabels,
  useAttendanceOfflineRecords,
} from "../../../offline-workspace/attendanceOffline";
import { useOfflineWorkspace } from "../../../offline-workspace/OfflineWorkspaceProvider";

const supportedStatuses = ["Hadir", "Sakit", "Izin", "Alfa"];
const attendanceStatusOptions = supportedStatuses.map((status) => ({
  value: status,
  label: status,
  tone: { Hadir: "success", Sakit: "warning", Izin: "warning", Alfa: "danger" }[status],
}));

export default function TableAttendances({ data, attendanceDate }) {
  const dispatch = useDispatch();
  const workspace = useOfflineWorkspace();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selectedAttendance = (data.Attendances || []).find((attendance) => attendance.attendanceDate === attendanceDate);
  const attendanceWorkspace = useAttendanceOfflineRecords({
    teacherId: workspace.teacherIdentity?.id,
    studentId: data.id,
    serverRecords: selectedAttendance ? [selectedAttendance] : [],
  });
  const effectiveAttendance = attendanceWorkspace.records[0]
    || selectedAttendance;
  const attendanceStatusClass = { Hadir: "is-hadir", Sakit: "is-sakit", Izin: "is-izin", Alfa: "is-alfa" }[effectiveAttendance?.status] || "is-empty";

  const handleAttendanceStatusChange = (status) => {
    if (workspace.isDemo) {
      setMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }
    if (!supportedStatuses.includes(status)) return;
    if (selectedAttendance) {
      attendanceWorkspace.updateAttendance(effectiveAttendance, status)
        .catch(() => {});
      return;
    }
    if (!workspace.connectionAvailable) {
      setMessage("Attendance baru hanya dapat dicatat saat online.");
      return;
    }
    const attendanceRequest = createAttendanceRecord({ StudentId: data.id, status, attendanceDate });
    setPending(true); setMessage("");
    dispatch(attendanceRequest).then(() => setMessage("Attendance dicatat.")).catch((error) => setMessage(error.message || "Attendance gagal diperbarui.")).finally(() => setPending(false));
  };

  const attendanceBusy = pending
    || attendanceWorkspace.savingEntityKey === effectiveAttendance?.entityKey
    || effectiveAttendance?.syncState === "syncing"
    || effectiveAttendance?.syncState === "conflict";
  const syncMessage = effectiveAttendance
    ? attendanceSyncLabels[effectiveAttendance.syncState]
    : "";

  return <tr className={`attendance-register__row ${attendanceStatusClass} border-t border-[var(--border)] align-top`}><th scope="row" className="px-5 py-4"><div className="flex items-center gap-3"><img className="attendance-register__portrait h-10 w-10 border border-[var(--border)] object-cover" src={data.imgUrl} alt={data.name} /><div><p className="font-semibold text-[var(--text)]">{data.name}</p><p className="text-xs font-normal text-[var(--muted)]">NIM {data.NIM || "-"}</p></div></div></th><td data-label="Kelas" className="px-4 py-4 text-[var(--text)]">{data.Class?.name || "-"}</td><td data-label="Status kehadiran" className="px-4 py-4"><div className={`attendance-register__status-control ${attendanceStatusClass} flex flex-col gap-2`}><SelectField id={`attendance-status-${data.id}`} label={`Status kehadiran ${data.name}`} hideLabel value={effectiveAttendance?.status || ""} onChange={handleAttendanceStatusChange} disabled={attendanceBusy || workspace.isDemo} options={attendanceStatusOptions} placeholder={attendanceBusy ? "Menyimpan..." : "Pilih status"} tone="attendance" className="attendance-register__select" />{effectiveAttendance && <StatusBadge status={effectiveAttendance.status} />}{syncMessage && <p role="status" className="text-xs text-[var(--muted)]">{syncMessage}</p>}{workspace.isDemo && <p className="text-xs text-[var(--muted)]">Tidak tersedia dalam mode demo.</p>}{(message || attendanceWorkspace.message) && <p aria-live="polite" className="text-xs text-[var(--muted)]">{message || attendanceWorkspace.message}</p>}</div></td><td data-label="Record" className="px-5 py-4 text-right"><ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} /></td></tr>;
}
