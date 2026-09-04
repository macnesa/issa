import { tw } from "../../../shared/ui/tw";
import { localDateValue } from "../../../utils/recordDates";
import { ButtonLink, StatusBadge } from "../../../shared/ui/ui";

export default function TableStudent({ data }) {
  const attendanceToday = (data.Attendances || []).find(
    (attendance) => attendance.attendanceDate === localDateValue()
  );

  return (
    <tr className={tw("teacher-roster-row border-t border-issa-border bg-issa-surface transition-colors duration-fast hover:bg-[color-mix(in_srgb,var(--issa-surface-subtle)_62%,var(--issa-surface))] [&>th]:px-5 [&>th]:py-4 [&>td]:px-5 [&>td]:py-4 max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-3 max-sm:px-4 max-sm:py-4 max-sm:[&>th]:col-span-full max-sm:[&>th]:p-0 max-sm:[&>td]:p-0 motion-reduce:transition-none")}>
      <th scope="row">
        <div className={tw("teacher-roster-row__student flex items-center gap-3.5")}>
          <img
            className={tw("teacher-roster-row__portrait h-11 w-11 rounded-xl bg-issa-subtle object-cover ring-1 ring-issa-border")}
            src={data.imgUrl}
            alt={data.name}
          />
          <div className={tw("min-w-0")}>
            <p className={tw("truncate font-semibold text-issa-text")}>{data.name}</p>
            <p className={tw("mt-0.5 text-metadata font-normal text-issa-muted")}>{data.gender || "-"} · {data.age || "-"} tahun</p>
          </div>
        </div>
      </th>
      <td className={tw("text-supporting text-issa-muted")} data-label="NIM">{data.NIM}</td>
      <td className={tw("text-supporting")} data-label="Kelas">{data.Class?.name || "-"}</td>
      <td data-label="Kehadiran hari ini"><StatusBadge status={attendanceToday?.status} /></td>
      <td className={tw("teacher-roster-row__actions text-right max-sm:col-span-full max-sm:w-full")}>
        <ButtonLink compact className={tw("teacher-roster-row__action max-sm:w-full")} to={`/students/${data.id}`}>Buka detail</ButtonLink>
      </td>
    </tr>
  );
}
