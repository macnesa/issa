import { Link } from "react-router-dom";
import { localDateValue } from "../../../utils/recordDates";
import { SecondaryButton, StatusBadge } from "../../../shared/ui/ui";

export default function TableStudent({ data }) {
  const attendanceToday = (data.Attendances || []).find((attendance) => attendance.attendanceDate === localDateValue());
  return <tr className="teacher-roster-row border-t border-[var(--border)] text-[var(--text)]">
    <th scope="row" className="px-5 py-4"><div className="flex items-center gap-3"><img className="teacher-roster-row__portrait h-10 w-10 border border-[var(--border)] object-cover" src={data.imgUrl} alt={data.name} /><div><p className="font-semibold">{data.name}</p><p className="text-xs font-normal text-[var(--muted)]">{data.gender || "-"} · {data.age || "-"} tahun</p></div></div></th>
    <td data-label="NIM" className="px-4 py-4 text-[var(--muted)]">{data.NIM}</td>
    <td data-label="Kelas" className="px-4 py-4">{data.Class?.name || "-"}</td>
    <td data-label="Attendance hari ini" className="px-4 py-4"><StatusBadge status={attendanceToday?.status} /></td>
    <td className="teacher-roster-row__actions px-5 py-4 text-right"><Link to={`/students/${data.id}`}><SecondaryButton className="teacher-roster-row__action" type="button">Buka detail</SecondaryButton></Link></td>
  </tr>;
}
