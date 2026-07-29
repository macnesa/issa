import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "lodash/isEmpty";
import TableAttendances from "../features/attendance/components/TableAttendance";
import { fetchStudentList } from "../store/action/ActionCreator";
import Pagination from "../features/students/components/Pagination";
import { localDateValue } from "../utils/recordDates";
import { EmptyState, ErrorState, LedgerShell, LoadingState, PageContainer, PageHeader, PrimaryButton } from "../shared/ui/ui";
import DateField from "../shared/ui/form-controls/DateField";
import TextField from "../shared/ui/form-controls/TextField";
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
    <PageHeader eyebrow="Attendance record" title="Kehadiran kelas" description="Pilih tanggal kejadian, lalu catat atau perbarui status kehadiran setiap siswa di kelas Anda." />
    <LedgerShell className="attendance-register">
      <form onSubmit={handleStudentSearchSubmit} className="attendance-register__toolbar">
        <DateField id="attendance-date" className="attendance-register__date-field" label="Tanggal aktif" value={attendanceDate} onChange={setAttendanceDate} required />
        <TextField id="attendance-student-search" className="attendance-register__search-field" label="Cari siswa" value={query.name} onChange={(event) => setQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" />
        <PrimaryButton type="submit">Cari</PrimaryButton>
      </form>
      {loading && <div className="attendance-register__state"><LoadingState label="Memuat attendance siswa..." /></div>}
      {!loading && error && <div className="attendance-register__state"><ErrorState message={error} onRetry={() => fetchStudentListForAttendance(query)} /></div>}
      {!loading && !error && isEmpty(rows) && <div className="attendance-register__state"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang dapat ditampilkan untuk pencarian ini." /></div>}
      {!loading && !error && !isEmpty(rows) && <><div className="attendance-register__records"><table className="attendance-register__table"><thead><tr><th>Siswa</th><th>Kelas</th><th>Status · {attendanceDate}</th><th className="attendance-register__action-heading">Record</th></tr></thead><tbody>{rows.map((student, index) => <TableAttendances key={student.id} data={student} index={index} attendanceDate={attendanceDate} />)}</tbody></table></div><div className="attendance-register__footer"><Pagination data={students} /></div></>}
    </LedgerShell>
  </PageContainer>;
}
