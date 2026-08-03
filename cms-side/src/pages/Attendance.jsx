import { tw } from "../shared/ui/tw";
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

  return <PageContainer className={tw("attendance-workspace text-issa-text")}>
    <PageHeader eyebrow="Attendance record" title="Kehadiran kelas" description="Pilih tanggal kejadian, lalu catat atau perbarui status kehadiran setiap siswa di kelas Anda." />
    <LedgerShell className={tw("attendance-register")}>
      <form onSubmit={handleStudentSearchSubmit} className={tw("attendance-register__toolbar grid items-end gap-3 border-b border-issa-border p-4 bg-issa-subtle md:[grid-template-columns:14rem_minmax(0,_1fr)_auto] [&>.issa-button]:w-full")}>
        <DateField id="attendance-date" className={tw("attendance-register__date-field")} label="Tanggal aktif" value={attendanceDate} onChange={setAttendanceDate} required />
        <TextField id="attendance-student-search" className={tw("attendance-register__search-field")} label="Cari siswa" value={query.name} onChange={(event) => setQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" />
        <PrimaryButton type="submit">Cari</PrimaryButton>
      </form>
      {loading && <div className={tw("attendance-register__state p-4")}><LoadingState label="Memuat attendance siswa..." /></div>}
      {!loading && error && <div className={tw("attendance-register__state p-4")}><ErrorState message={error} onRetry={() => fetchStudentListForAttendance(query)} /></div>}
      {!loading && !error && isEmpty(rows) && <div className={tw("attendance-register__state p-4")}><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang dapat ditampilkan untuk pencarian ini." /></div>}
      {!loading && !error && !isEmpty(rows) && <><div className={tw("attendance-register__records min-w-0")}><table className={tw("attendance-register__table w-full min-w-0 border-collapse text-issa-text text-table text-left [&_thead]:bg-issa-subtle [&_thead]:text-issa-muted [&_thead_th]:p-3 [&_thead_th]:px-4 [&_thead_th]:text-table-header [&_thead_th]:font-bold [&_thead_th]:tracking-metadata [&_thead_th]:uppercase max-lg:[&_thead]:hidden max-lg:[&_tbody]:grid")}><thead><tr><th>Siswa</th><th>Kelas</th><th>Status · {attendanceDate}</th><th className={tw("attendance-register__action-heading text-right")}>Record</th></tr></thead><tbody>{rows.map((student, index) => <TableAttendances key={student.id} data={student} index={index} attendanceDate={attendanceDate} />)}</tbody></table></div><div className={tw("attendance-register__footer border-t border-issa-border p-4 bg-issa-surface")}><Pagination data={students} /></div></>}
    </LedgerShell>
  </PageContainer>;
}
