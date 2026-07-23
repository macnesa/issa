import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Pagination from "../features/students/components/Pagination";
import TableStudent from "../features/students/components/TableStudents";
import { fetchStudentList } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, MetricCard, PageContainer, PageHeader, PrimaryButton, Surface } from "../shared/ui/ui";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const [studentSearchQuery, setStudentSearchQuery] = useState({ name: "" });

  const fetchStudentListForDashboard = (nextStudentSearchQuery) => {
    setLoading(true);
    setError("");
    return dispatch(fetchStudentList(nextStudentSearchQuery)).catch((requestError) => setError(requestError.message || "Daftar siswa tidak dapat dimuat.")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudentListForDashboard(); }, [dispatch]);

  const handleStudentSearchSubmit = (event) => { event.preventDefault(); fetchStudentListForDashboard(studentSearchQuery); };
  const studentRows = Array.isArray(students.rows) ? students.rows : [];
  const className = studentRows[0]?.Class?.name || "Kelas Anda";

  return <PageContainer>
    <PageHeader eyebrow="Teacher workspace" title="Dashboard siswa" description="Mulai dari daftar siswa kelas Anda untuk melihat rekam perkembangan, mencatat feedback, attendance, dan score." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <MetricCard label="Kelas aktif" value={className} detail="Scope akses teacher" />
      <MetricCard label="Siswa pada halaman ini" value={studentRows.length} detail="Data dari kelas sendiri" />
      <MetricCard label="Alur hari ini" value="Catat & tinjau" detail="Feedback, attendance, score" />
    </div>
    <Surface>
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-lg font-semibold text-[var(--text)]">Daftar siswa</h2><p className="mt-1 text-sm text-[var(--muted)]">Buka detail untuk melanjutkan pencatatan perkembangan siswa.</p></div>
        <form className="flex w-full gap-2 sm:w-auto" onSubmit={handleStudentSearchSubmit}>
          <input value={studentSearchQuery.name} onChange={(event) => setStudentSearchQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" className="min-h-10 w-full rounded-lg border border-[var(--border-strong)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[var(--focus)] sm:w-64" />
          <PrimaryButton type="submit">Cari</PrimaryButton>
        </form>
      </div>
      {loading && <div className="p-5"><LoadingState label="Memuat daftar siswa..." /></div>}
      {!loading && error && <div className="p-5"><ErrorState message={error} onRetry={() => fetchStudentListForDashboard(studentSearchQuery)} /></div>}
      {!loading && !error && isEmpty(studentRows) && <div className="p-5"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang cocok dengan pencarian ini." /></div>}
      {!loading && !error && !isEmpty(studentRows) && <>
        <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)]"><tr><th className="px-5 py-3">Siswa</th><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Attendance hari ini</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody>{studentRows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}</tbody></table></div>
        <div className="border-t border-[var(--border)] p-4"><Pagination data={students} /></div>
      </>}
    </Surface>
  </PageContainer>;
}
