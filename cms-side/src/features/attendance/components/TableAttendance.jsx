import { useState } from "react";
import { useDispatch } from "react-redux";
import { createAttendanceRecord, updateAttendanceRecord } from "../../../store/action/ActionCreator";
import ModalAttendances from "./ModalAttendances";
import { StatusBadge } from "../../../shared/ui/ui";
import SelectField from "../../../shared/ui/form-controls/SelectField";

const supportedStatuses = ["Hadir", "Sakit", "Izin", "Alfa"];
const attendanceStatusOptions = supportedStatuses.map((status) => ({
  value: status,
  label: status,
  tone: { Hadir: "success", Sakit: "warning", Izin: "warning", Alfa: "danger" }[status],
}));

export default function TableAttendances({ data, attendanceDate }) {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selectedAttendance = (data.Attendances || []).find((attendance) => attendance.attendanceDate === attendanceDate);
  const attendanceStatusClass = { Hadir: "is-hadir", Sakit: "is-sakit", Izin: "is-izin", Alfa: "is-alfa" }[selectedAttendance?.status] || "is-empty";

  const handleAttendanceStatusChange = (status) => {
    if (!supportedStatuses.includes(status)) return;
    const attendanceRequest = selectedAttendance ? updateAttendanceRecord({ StudentId: data.id, status, attendanceDate }) : createAttendanceRecord({ StudentId: data.id, status, attendanceDate });
    setPending(true); setMessage("");
    dispatch(attendanceRequest).then(() => setMessage(selectedAttendance ? "Attendance diperbarui." : "Attendance dicatat.")).catch((error) => setMessage(error.message || "Attendance gagal diperbarui.")).finally(() => setPending(false));
  };

  return <tr className={`attendance-register__row ${attendanceStatusClass} border-t border-[var(--border)] align-top`}><th scope="row" className="px-5 py-4"><div className="flex items-center gap-3"><img className="attendance-register__portrait h-10 w-10 border border-[var(--border)] object-cover" src={data.imgUrl} alt={data.name} /><div><p className="font-semibold text-[var(--text)]">{data.name}</p><p className="text-xs font-normal text-[var(--muted)]">NIM {data.NIM || "-"}</p></div></div></th><td className="px-4 py-4 text-[var(--text)]">{data.Class?.name || "-"}</td><td className="px-4 py-4"><div className={`attendance-register__status-control ${attendanceStatusClass} flex flex-col gap-2`}><SelectField id={`attendance-status-${data.id}`} label={`Status kehadiran ${data.name}`} hideLabel value={selectedAttendance?.status || ""} onChange={handleAttendanceStatusChange} disabled={pending} options={attendanceStatusOptions} placeholder={pending ? "Menyimpan..." : "Pilih status"} tone="attendance" className="attendance-register__select" />{selectedAttendance && <StatusBadge status={selectedAttendance.status} />}{message && <p role="status" className="text-xs text-[var(--muted)]">{message}</p>}</div></td><td className="px-5 py-4 text-right"><ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} /></td></tr>;
}
