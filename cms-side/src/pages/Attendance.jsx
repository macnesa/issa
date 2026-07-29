import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "lodash/isEmpty";
import TableAttendances from "../features/attendance/components/TableAttendance";
import { fetchStudentList } from "../store/action/ActionCreator";
import Pagination from "../features/students/components/Pagination";
import { localDateValue } from "../utils/recordDates";
import { EmptyState, ErrorState, FormField, LoadingState, PageContainer, PageHeader, PrimaryButton, Surface } from "../shared/ui/ui";
import DateField from "../shared/ui/form-controls/DateField";
import "../features/attendance/attendance-workspace.css";

export default function Attendance() {
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ name: "" });
  const [attendanceDate, setAttendanceDate] = useState(localDateValue());

  const fetchStudentListForAttendance = (studentSearchQuery) => { setLoading(true); setError(""); return dispatch(fetchStudentList(studentSearchQuery)).catch((requestError) => setError(requestError.message || "Attendance siswa tidak dapat dimuat.")).finally(() => setLoading(false)); };
  useEffect(() => { fetchStudentListForAttendance(); }, [dispatch]);
  const handleStudentSearchSubmit = (event) => { event.preventDefault(); fetchStudentListForAttendance(query); };
  const rows = Array.isArray(students.rows) ? students.rows : [];

  return <PageContainer className="attendance-workspace">
    <div className="attendance-workspace__header"><PageHeader eyebrow="Attendance record" title="Kehadiran kelas" description="Pilih tanggal kejadian, lalu catat atau perbarui status kehadiran setiap siswa di kelas Anda." /></div>
    <Surface className="attendance-register">
      <form onSubmit={handleStudentSearchSubmit} className="attendance-register__toolbar grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
        <DateField id="attendance-date" className="attendance-register__date-field" label="Tanggal aktif" value={attendanceDate} onChange={setAttendanceDate} required />
        <FormField className="attendance-register__search-field" label="Cari siswa"><input value={query.name} onChange={(event) => setQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" className="issa-native-control min-h-10" /></FormField>
        <PrimaryButton type="submit">Cari</PrimaryButton>
      </form>
      {loading && <div className="p-5"><LoadingState label="Memuat attendance siswa..." /></div>}
      {!loading && error && <div className="p-5"><ErrorState message={error} onRetry={() => fetchStudentListForAttendance(query)} /></div>}
      {!loading && !error && isEmpty(rows) && <div className="p-5"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang dapat ditampilkan untuk pencarian ini." /></div>}
      {!loading && !error && !isEmpty(rows) && <><div className="attendance-register__records"><table className="attendance-register__table w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide"><tr><th className="px-5 py-3">Siswa</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Status · {attendanceDate}</th><th className="px-5 py-3 text-right">Record</th></tr></thead><tbody>{rows.map((student, index) => <TableAttendances key={student.id} data={student} index={index} attendanceDate={attendanceDate} />)}</tbody></table></div><div className="attendance-register__footer border-t border-[var(--border)] p-4"><Pagination data={students} /></div></>}
    </Surface>
  </PageContainer>;
}
