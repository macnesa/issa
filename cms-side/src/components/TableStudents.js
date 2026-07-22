import { Link } from "react-router-dom";
import { localDateValue } from "../utils/recordDates";
import { SecondaryButton, StatusBadge } from "./ui";

export default function TableStudent({ data }) {
  const attendanceToday = (data.Attendances || []).find((attendance) => attendance.attendanceDate === localDateValue());
  return <tr className="border-t border-[var(--border)] text-[var(--text)] hover:bg-slate-50">
    <th scope="row" className="px-5 py-4"><div className="flex items-center gap-3"><img className="h-10 w-10 rounded-full border border-[var(--border)] object-cover" src={data.imgUrl} alt={data.name} /><div><p className="font-semibold">{data.name}</p><p className="text-xs font-normal text-[var(--muted)]">{data.gender || "-"} · {data.age || "-"} tahun</p></div></div></th>
    <td className="px-4 py-4 text-[var(--muted)]">{data.NIM}</td><td className="px-4 py-4">{data.Class?.name || "-"}</td><td className="px-4 py-4"><StatusBadge status={attendanceToday?.status} /></td>
    <td className="px-5 py-4 text-right"><Link to={`/students/${data.id}`}><SecondaryButton type="button">Buka detail</SecondaryButton></Link></td>
  </tr>;
}
