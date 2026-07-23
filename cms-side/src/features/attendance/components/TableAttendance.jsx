import { useState } from "react";
import { useDispatch } from "react-redux";
import { createAttendanceRecord, updateAttendanceRecord } from "../../../store/action/ActionCreator";
import ModalAttendances from "./ModalAttendances";
import { StatusBadge } from "../../../shared/ui/ui";

const supportedStatuses = ["Hadir", "Sakit", "Izin", "Alfa"];

export default function TableAttendances({ data, attendanceDate }) {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selectedAttendance = (data.Attendances || []).find((attendance) => attendance.attendanceDate === attendanceDate);

  const handleAttendanceStatusChange = (event) => {
    const status = event.target.value;
    if (!supportedStatuses.includes(status)) return;
    const attendanceRequest = selectedAttendance ? updateAttendanceRecord({ StudentId: data.id, status, attendanceDate }) : createAttendanceRecord({ StudentId: data.id, status, attendanceDate });
    setPending(true); setMessage("");
    dispatch(attendanceRequest).then(() => setMessage(selectedAttendance ? "Attendance diperbarui." : "Attendance dicatat.")).catch((error) => setMessage(error.message || "Attendance gagal diperbarui.")).finally(() => setPending(false));
  };

  return <tr className="border-t border-[var(--border)] align-top hover:bg-slate-50"><th scope="row" className="px-5 py-4"><div className="flex items-center gap-3"><img className="h-10 w-10 rounded-full border border-[var(--border)] object-cover" src={data.imgUrl} alt={data.name} /><div><p className="font-semibold text-[var(--text)]">{data.name}</p><p className="text-xs font-normal text-[var(--muted)]">NIM {data.NIM || "-"}</p></div></div></th><td className="px-4 py-4 text-[var(--text)]">{data.Class?.name || "-"}</td><td className="px-4 py-4"><div className="flex min-w-44 flex-col gap-2"><select value={selectedAttendance?.status || ""} onChange={handleAttendanceStatusChange} disabled={pending} aria-label={`Status attendance ${data.name}`} className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--focus)] disabled:opacity-60"><option value="" disabled>{pending ? "Menyimpan..." : "Pilih status"}</option>{supportedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>{selectedAttendance && <StatusBadge status={selectedAttendance.status} />}{message && <p role="status" className="text-xs text-[var(--muted)]">{message}</p>}</div></td><td className="px-5 py-4 text-right"><ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} /></td></tr>;
}
