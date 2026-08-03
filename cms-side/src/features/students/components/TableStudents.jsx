import { tw } from "../../../shared/ui/tw";
import { localDateValue } from "../../../utils/recordDates";
import { ButtonLink, StatusBadge } from "../../../shared/ui/ui";

export default function TableStudent({ data }) {
  const attendanceToday = (data.Attendances || []).find((attendance) => attendance.attendanceDate === localDateValue());
  return <tr className={tw("teacher-roster-row border-t border-issa-border bg-issa-surface transition-colors duration-default hover:bg-issa-subtle [&>th]:p-4 [&>td]:p-4 max-sm:grid max-sm:grid-cols-2 max-sm:[gap:var(--issa-space-3)_var(--issa-space-4)] max-sm:p-4 max-sm:[&>th]:col-span-full max-sm:[&>th]:p-0 max-sm:[&>td]:p-0 motion-reduce:[transition:none]")}>
    <th scope="row"><div className={tw("teacher-roster-row__student flex items-center gap-3")}><img className={tw("teacher-roster-row__portrait w-control h-control border border-issa-border rounded-control object-cover")} src={data.imgUrl} alt={data.name} /><div><p className={tw("text-issa-text font-semibold")}>{data.name}</p><p className={tw("text-issa-muted text-metadata")}>{data.gender || "-"} · {data.age || "-"} tahun</p></div></div></th>
    <td className={tw("text-issa-muted text-metadata")} data-label="NIM">{data.NIM}</td>
    <td data-label="Kelas">{data.Class?.name || "-"}</td>
    <td data-label="Attendance hari ini"><StatusBadge status={attendanceToday?.status} /></td>
    <td className={tw("teacher-roster-row__actions text-right max-sm:col-span-full max-sm:w-full")}><ButtonLink compact className={tw("teacher-roster-row__action max-sm:w-full")} to={`/students/${data.id}`}>Buka detail</ButtonLink></td>
  </tr>;
}
