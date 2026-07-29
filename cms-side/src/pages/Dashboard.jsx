import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import isEmpty from "lodash/isEmpty";
import TableStudent from "../features/students/components/TableStudents";
import TeacherAttentionQueue from "../features/student-insights/components/TeacherAttentionQueue";
import { fetchStudentList } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, PrimaryButton } from "../shared/ui/ui";
import { localDateValue } from "../utils/recordDates";
import "../features/students/student-record.css";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const [studentSearchQuery, setStudentSearchQuery] = useState({ name: "" });
  const [appliedStudentSearchQuery, setAppliedStudentSearchQuery] = useState({ name: "" });
  const [activeClassName, setActiveClassName] = useState("");
  const [classAttendanceSummary, setClassAttendanceSummary] = useState(null);
  const [attentionCount, setAttentionCount] = useState(null);

  const fetchStudentListForDashboard = (nextStudentSearchQuery = {}, pageIndex = 1) => {
    setLoading(true);
    setError("");
    return dispatch(fetchStudentList(nextStudentSearchQuery, pageIndex))
      .then((studentListResponse) => {
        const scopedRows = Array.isArray(studentListResponse?.rows)
          ? studentListResponse.rows
          : [];
        const scopedClassName = scopedRows[0]?.Class?.name;
        if (scopedClassName) setActiveClassName(scopedClassName);
        if (
          pageIndex === 1
          && !nextStudentSearchQuery.name?.trim()
        ) {
          const classStudentCount = Math.max(
            Number(studentListResponse?.count) || 0,
            0
          );
          const attendanceRecordedToday = scopedRows.filter((student) => (
            (student.Attendances || []).some(
              (attendance) => attendance.attendanceDate === localDateValue()
            )
          )).length;
          setClassAttendanceSummary({
            attendanceRecordedToday,
            classStudentCount,
            complete: scopedRows.length >= classStudentCount,
          });
        }
        return studentListResponse;
      })
      .catch((requestError) => setError(requestError.message || "Daftar siswa tidak dapat dimuat."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudentListForDashboard({}, 1); }, [dispatch]);

  const handleStudentSearchSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    const nextStudentSearchQuery = { name: studentSearchQuery.name.trim() };
    setAppliedStudentSearchQuery(nextStudentSearchQuery);
    fetchStudentListForDashboard(nextStudentSearchQuery, 1);
  };
  const studentRows = Array.isArray(students.rows) ? students.rows : [];
  const totalStudents = Math.max(Number(students.count) || 0, 0);
  const pageSize = Math.max(Number(students.pageSize) || 7, 1);
  const totalPages = Math.max(Number(students.totalPages) || 1, 1);
  const currentPage = Math.min(
    Math.max(Number(students.page) || 1, 1),
    totalPages
  );
  const firstDisplayedStudent = totalStudents
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const lastDisplayedStudent = totalStudents
    ? Math.min(firstDisplayedStudent + studentRows.length - 1, totalStudents)
    : 0;
  const className = activeClassName || studentRows[0]?.Class?.name || "Kelas Anda";
  const attendanceSummaryLabel = !classAttendanceSummary
    ? "Memuat…"
    : classAttendanceSummary.complete
      ? `${classAttendanceSummary.attendanceRecordedToday} dari ${classAttendanceSummary.classStudentCount} tercatat`
      : `${classAttendanceSummary.attendanceRecordedToday} tercatat pada halaman pertama`;

  const handleStudentPageChange = (nextPage) => {
    if (
      nextPage < 1
      || nextPage > totalPages
      || nextPage === currentPage
    ) return;
    fetchStudentListForDashboard(appliedStudentSearchQuery, nextPage);
  };

  return <PageContainer className="teacher-dashboard">
    <div><PageHeader eyebrow="Teacher workspace" title="Dashboard siswa" description="Mulai dari daftar siswa kelas Anda untuk melihat rekam perkembangan, mencatat feedback, attendance, dan score." /></div>
    <section className="teacher-dashboard__class-ledger" aria-label="Ringkasan kelas aktif">
      <div className="teacher-dashboard__class-anchor"><p className="text-xs font-semibold uppercase tracking-[0.15em]">Kelas aktif</p><strong>{className}</strong><span>Scope akses teacher</span></div>
      <dl className="teacher-dashboard__class-facts">
        <div>
          <dt>Kehadiran hari ini</dt>
          <dd>
            <Link to="/attendance">{attendanceSummaryLabel}</Link>
          </dd>
          <span>
            {classAttendanceSummary?.complete === false
              ? "Buka kehadiran untuk cakupan kelas lengkap"
              : "Buka workspace kehadiran"}
          </span>
        </div>
        <div>
          <dt>Perlu ditinjau</dt>
          <dd>
            <a href="#teacher-attention-queue-title">
              {attentionCount === null ? "Memuat…" : `${attentionCount} siswa`}
            </a>
          </dd>
          <span>Antrean tindak lanjut guru</span>
        </div>
      </dl>
    </section>
    <TeacherAttentionQueue onCountChange={setAttentionCount} />
    <section className="teacher-dashboard__roster">
      <div className="teacher-dashboard__roster-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-lg font-semibold text-[var(--text)]">Daftar siswa</h2><p className="mt-1 text-sm text-[var(--muted)]">Buka detail untuk melanjutkan pencatatan perkembangan siswa.</p></div>
        <form className="grid w-full gap-1.5 sm:w-auto" onSubmit={handleStudentSearchSubmit}>
          <label className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--muted)]" htmlFor="dashboard-student-search">
            Cari siswa
          </label>
          <div className="flex w-full gap-2">
            <input id="dashboard-student-search" value={studentSearchQuery.name} onChange={(event) => setStudentSearchQuery({ name: event.target.value })} type="search" name="name" placeholder="Masukkan nama siswa" className="issa-native-control min-h-10 min-w-0 flex-1 sm:w-64" />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Mencari…" : "Cari"}
            </PrimaryButton>
          </div>
        </form>
      </div>
      {loading && <div className="p-5"><LoadingState label="Memuat daftar siswa..." /></div>}
      {!loading && error && <div className="p-5"><ErrorState message={error} onRetry={() => fetchStudentListForDashboard(appliedStudentSearchQuery, currentPage)} /></div>}
      {!loading && !error && isEmpty(studentRows) && <div className="p-5"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang cocok dengan pencarian ini." /></div>}
      {!loading && !error && !isEmpty(studentRows) && <>
        <div className="overflow-x-auto"><table className="teacher-dashboard__roster-table min-w-[760px] w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide"><tr><th className="px-5 py-3">Siswa</th><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Attendance hari ini</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody>{studentRows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}</tbody></table></div>
        <div className="border-t border-[var(--border)] p-4">
          <nav className="flex items-center justify-between gap-3 max-[639px]:items-start max-[639px]:flex-col" aria-label="Paginasi siswa Dashboard">
            <p className="text-sm text-[var(--muted)]">
              Menampilkan {firstDisplayedStudent}–{lastDisplayedStudent} dari {totalStudents} siswa
              <span className="mx-2" aria-hidden="true">·</span>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleStudentPageChange(currentPage - 1)} disabled={currentPage <= 1} className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
              <button type="button" onClick={() => handleStudentPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Berikutnya</button>
            </div>
          </nav>
        </div>
      </>}
    </section>
  </PageContainer>;
}
