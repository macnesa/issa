import { localDateValue } from "../../../utils/recordDates";
import { ButtonLink, StatusBadge } from "../../../shared/ui/ui";

export default function TableStudent({ data }) {
  const attendanceToday = (data.Attendances || []).find((attendance) => attendance.attendanceDate === localDateValue());
  return <tr className="teacher-roster-row">
    <th scope="row"><div className="teacher-roster-row__student"><img className="teacher-roster-row__portrait" src={data.imgUrl} alt={data.name} /><div><p>{data.name}</p><p>{data.gender || "-"} · {data.age || "-"} tahun</p></div></div></th>
    <td data-label="NIM">{data.NIM}</td>
    <td data-label="Kelas">{data.Class?.name || "-"}</td>
    <td data-label="Attendance hari ini"><StatusBadge status={attendanceToday?.status} /></td>
    <td className="teacher-roster-row__actions"><ButtonLink compact className="teacher-roster-row__action" to={`/students/${data.id}`}>Buka detail</ButtonLink></td>
  </tr>;
}
