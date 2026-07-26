import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Pagination from "../features/students/components/Pagination";
import TableStudent from "../features/students/components/TableStudents";
import TeacherAttentionQueue from "../features/student-insights/components/TeacherAttentionQueue";
import { fetchStudentList } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, PrimaryButton } from "../shared/ui/ui";
import "../features/students/student-record.css";

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

  return <PageContainer className="teacher-dashboard">
    <div><PageHeader eyebrow="Teacher workspace" title="Dashboard siswa" description="Mulai dari daftar siswa kelas Anda untuk melihat rekam perkembangan, mencatat feedback, attendance, dan score." /></div>
    <section className="teacher-dashboard__class-ledger" aria-label="Ringkasan kelas aktif">
      <div className="teacher-dashboard__class-anchor"><p className="text-xs font-semibold uppercase tracking-[0.15em]">Kelas aktif</p><strong>{className}</strong><span>Scope akses teacher</span></div>
      <dl className="teacher-dashboard__class-facts">
        <div><dt>Siswa pada halaman ini</dt><dd>{studentRows.length}</dd><span>Data dari kelas sendiri</span></div>
        <div><dt>Alur hari ini</dt><dd>Catat &amp; tinjau</dd><span>Feedback, attendance, score</span></div>
      </dl>
    </section>
    <TeacherAttentionQueue />
    <section className="teacher-dashboard__roster">
      <div className="teacher-dashboard__roster-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-lg font-semibold text-[var(--text)]">Daftar siswa</h2><p className="mt-1 text-sm text-[var(--muted)]">Buka detail untuk melanjutkan pencatatan perkembangan siswa.</p></div>
        <form className="flex w-full gap-2 sm:w-auto" onSubmit={handleStudentSearchSubmit}>
          <input value={studentSearchQuery.name} onChange={(event) => setStudentSearchQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" className="issa-native-control min-h-10 sm:w-64" />
          <PrimaryButton type="submit">Cari</PrimaryButton>
        </form>
      </div>
      {loading && <div className="p-5"><LoadingState label="Memuat daftar siswa..." /></div>}
      {!loading && error && <div className="p-5"><ErrorState message={error} onRetry={() => fetchStudentListForDashboard(studentSearchQuery)} /></div>}
      {!loading && !error && isEmpty(studentRows) && <div className="p-5"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang cocok dengan pencarian ini." /></div>}
      {!loading && !error && !isEmpty(studentRows) && <>
        <div className="overflow-x-auto"><table className="teacher-dashboard__roster-table min-w-[760px] w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide"><tr><th className="px-5 py-3">Siswa</th><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Attendance hari ini</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody>{studentRows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}</tbody></table></div>
        <div className="border-t border-[var(--border)] p-4"><Pagination data={students} /></div>
      </>}
    </section>
  </PageContainer>;
}
