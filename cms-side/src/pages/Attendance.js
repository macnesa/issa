import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TableAttendances from "../components/TableAttendance";
import { studentsFetch } from "../store/action/ActionCreator";
import Pagination from "../components/Pagination";
import { localDateValue } from "../utils/recordDates";
import { EmptyState, ErrorState, FormField, LoadingState, PageContainer, PageHeader, PrimaryButton, Surface } from "../components/ui";

export default function Attendance() {
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ name: "" });
  const [attendanceDate, setAttendanceDate] = useState(localDateValue());

  const loadStudents = (nextQuery) => { setLoading(true); setError(""); return dispatch(studentsFetch(nextQuery)).catch((requestError) => setError(requestError.message || "Attendance siswa tidak dapat dimuat.")).finally(() => setLoading(false)); };
  useEffect(() => { loadStudents(); }, [dispatch]);
  const submitQuery = (event) => { event.preventDefault(); loadStudents(query); };
  const rows = Array.isArray(students.rows) ? students.rows : [];

  return <PageContainer>
    <PageHeader eyebrow="Class record" title="Attendance" description="Pilih tanggal kejadian, lalu catat atau perbarui status attendance setiap siswa di kelas Anda." />
    <Surface>
      <form onSubmit={submitQuery} className="grid gap-3 border-b border-[var(--border)] p-5 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
        <FormField label="Tanggal attendance"><input id="attendance-date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} onInput={(event) => setAttendanceDate(event.target.value)} className="min-h-10 w-full rounded-lg border border-[var(--border-strong)] px-3 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" /></FormField>
        <FormField label="Cari siswa"><input value={query.name} onChange={(event) => setQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" className="min-h-10 w-full rounded-lg border border-[var(--border-strong)] px-3 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)]" /></FormField>
        <PrimaryButton type="submit">Cari</PrimaryButton>
      </form>
      {loading && <div className="p-5"><LoadingState label="Memuat attendance siswa..." /></div>}
      {!loading && error && <div className="p-5"><ErrorState message={error} onRetry={() => loadStudents(query)} /></div>}
      {!loading && !error && rows.length === 0 && <div className="p-5"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang dapat ditampilkan untuk pencarian ini." /></div>}
      {!loading && !error && rows.length > 0 && <><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)]"><tr><th className="px-5 py-3">Siswa</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Attendance {attendanceDate}</th><th className="px-5 py-3 text-right">Record</th></tr></thead><tbody>{rows.map((student, index) => <TableAttendances key={student.id} data={student} index={index} attendanceDate={attendanceDate} />)}</tbody></table></div><div className="border-t border-[var(--border)] p-4"><Pagination data={students} /></div></>}
    </Surface>
  </PageContainer>;
}
