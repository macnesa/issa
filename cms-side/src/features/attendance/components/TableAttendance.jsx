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

  return <tr className="attendance-register__row"><th scope="row"><div className="attendance-register__student"><img className="attendance-register__portrait" src={data.imgUrl} alt={data.name} /><div><p>{data.name}</p><p>NIM {data.NIM || "-"}</p></div></div></th><td data-label="Kelas">{data.Class?.name || "-"}</td><td data-label="Status kehadiran"><div className="attendance-register__status-control"><SelectField id={`attendance-status-${data.id}`} label={`Status kehadiran ${data.name}`} hideLabel value={effectiveAttendance?.status || ""} onChange={handleAttendanceStatusChange} disabled={attendanceBusy || workspace.isDemo} options={attendanceStatusOptions} placeholder={attendanceBusy ? "Menyimpan..." : "Pilih status"} />{effectiveAttendance && <StatusBadge status={effectiveAttendance.status} />}{syncMessage && <p role="status">{syncMessage}</p>}{workspace.isDemo && <p>Tidak tersedia dalam mode demo.</p>}{(message || attendanceWorkspace.message) && <p aria-live="polite">{message || attendanceWorkspace.message}</p>}</div></td><td data-label="Record" className="attendance-register__record-cell"><ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} /></td></tr>;
}
