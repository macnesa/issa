import { tw } from "../../../shared/ui/tw";
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

  return <tr className={tw("attendance-register__row border-t border-issa-border bg-issa-surface align-top transition-colors duration-default hover:bg-issa-subtle [&>th]:p-4 [&>td]:p-4 max-lg:grid max-lg:[grid-template-columns:minmax(0,_1fr)_minmax(8rem,_0.4fr)] max-lg:gap-4 max-lg:p-4 max-lg:[&>th]:min-w-0 max-lg:[&>td]:min-w-0 max-lg:[&>th]:p-0 max-lg:[&>td]:p-0 max-sm:grid-cols-1 motion-reduce:[transition:none]")}><th scope="row"><div className={tw("attendance-register__student flex items-center gap-3")}><img className={tw("attendance-register__portrait w-control h-control border border-issa-border rounded-control object-cover")} src={data.imgUrl} alt={data.name} /><div><p className={tw("text-issa-text font-semibold")}>{data.name}</p><p className={tw("text-issa-muted text-metadata font-normal")}>NIM {data.NIM || "-"}</p></div></div></th><td className={tw("max-lg:col-start-1 max-sm:col-start-1")} data-label="Kelas">{data.Class?.name || "-"}</td><td className={tw("max-lg:col-start-2 max-lg:row-start-2 max-lg:self-end max-lg:text-left max-sm:col-start-1 max-sm:row-auto")} data-label="Status kehadiran"><div className={tw("attendance-register__status-control grid [min-width:11rem] gap-2 max-lg:min-w-0 [&_p]:text-issa-muted [&_p]:text-metadata")}><SelectField id={`attendance-status-${data.id}`} label={`Status kehadiran ${data.name}`} hideLabel value={effectiveAttendance?.status || ""} onChange={handleAttendanceStatusChange} disabled={attendanceBusy || workspace.isDemo} options={attendanceStatusOptions} placeholder={attendanceBusy ? "Menyimpan..." : "Pilih status"} />{effectiveAttendance && <StatusBadge status={effectiveAttendance.status} />}{syncMessage && <p role="status">{syncMessage}</p>}{workspace.isDemo && <p>Tidak tersedia dalam mode demo.</p>}{(message || attendanceWorkspace.message) && <p aria-live="polite">{message || attendanceWorkspace.message}</p>}</div></td><td data-label="Record" className={tw("attendance-register__record-cell text-right")}><ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} /></td></tr>;
}
