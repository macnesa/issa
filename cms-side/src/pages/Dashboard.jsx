import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import TableStudent from "../features/students/components/TableStudents";
import TeacherAttentionQueue from "../features/student-insights/components/TeacherAttentionQueue";
import { fetchStudentList } from "../store/action/ActionCreator";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  LedgerShell,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "../shared/ui/ui";
import TextField from "../shared/ui/form-controls/TextField";
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
    <PageHeader eyebrow="Teacher workspace" title="Dashboard siswa" description="Mulai dari daftar siswa kelas Anda untuk melihat rekam perkembangan, mencatat feedback, attendance, dan score." />
    <Surface className="teacher-dashboard__class-ledger" aria-label="Ringkasan kelas aktif">
      <div className="teacher-dashboard__class-anchor"><p>Kelas aktif</p><strong>{className}</strong><span>Scope akses teacher</span></div>
      <dl className="teacher-dashboard__class-facts">
        <div>
          <dt>Kehadiran hari ini</dt>
          <dd>
            <ButtonLink compact to="/attendance">{attendanceSummaryLabel}</ButtonLink>
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
    </Surface>
    <TeacherAttentionQueue onCountChange={setAttentionCount} />
    <LedgerShell
      className="teacher-dashboard__roster"
      eyebrow="Daftar kelas"
      title="Daftar siswa"
      description="Buka detail untuk melanjutkan pencatatan perkembangan siswa."
    >
      <form className="teacher-dashboard__search" onSubmit={handleStudentSearchSubmit}>
          <TextField
            id="dashboard-student-search"
            label="Cari siswa"
            value={studentSearchQuery.name}
            onChange={(event) => setStudentSearchQuery({ name: event.target.value })}
            type="search"
            name="name"
            placeholder="Masukkan nama siswa"
          />
          <div className="teacher-dashboard__search-action">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Mencari…" : "Cari"}
            </PrimaryButton>
          </div>
      </form>
      {loading && <div className="teacher-dashboard__state"><LoadingState label="Memuat daftar siswa..." /></div>}
      {!loading && error && <div className="teacher-dashboard__state"><ErrorState message={error} onRetry={() => fetchStudentListForDashboard(appliedStudentSearchQuery, currentPage)} /></div>}
      {!loading && !error && isEmpty(studentRows) && <div className="teacher-dashboard__state"><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang cocok dengan pencarian ini." /></div>}
      {!loading && !error && !isEmpty(studentRows) && <>
        <div className="teacher-dashboard__roster-overflow"><table className="teacher-dashboard__roster-table"><thead><tr><th>Siswa</th><th>NIM</th><th>Kelas</th><th>Attendance hari ini</th><th>Aksi</th></tr></thead><tbody>{studentRows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}</tbody></table></div>
        <div className="teacher-dashboard__pagination">
          <nav aria-label="Paginasi siswa Dashboard">
            <p>
              Menampilkan {firstDisplayedStudent}–{lastDisplayedStudent} dari {totalStudents} siswa
              <span className="teacher-dashboard__pagination-separator" aria-hidden="true">·</span>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div>
              <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage - 1)} disabled={currentPage <= 1}>Sebelumnya</SecondaryButton>
              <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Berikutnya</SecondaryButton>
            </div>
          </nav>
        </div>
      </>}
    </LedgerShell>
  </PageContainer>;
}
