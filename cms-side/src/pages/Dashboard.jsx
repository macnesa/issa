import { tw } from "../shared/ui/tw";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Pagination as FlowbitePagination } from "flowbite-react/components/Pagination";
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
  Surface,
} from "../shared/ui/ui";
import TextField from "../shared/ui/form-controls/TextField";
import { localDateValue } from "../utils/recordDates";

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

  return <PageContainer className={tw("teacher-dashboard text-issa-text")}>
    <PageHeader eyebrow="Teacher workspace" title="Dashboard siswa" description="Mulai dari daftar siswa kelas Anda untuk melihat rekam perkembangan, mencatat feedback, attendance, dan score." />
    <Surface className={tw("teacher-dashboard__class-ledger grid overflow-hidden mb-6 md:[grid-template-columns:minmax(16rem,_1fr)_minmax(0,_1.4fr)]")} aria-label="Ringkasan kelas aktif">
      <div className={tw("teacher-dashboard__class-anchor p-6 border-b border-issa-border bg-issa-text text-issa-inverse md:[border-right:var(--issa-border-width)_solid_var(--issa-border)] md:[border-bottom:0] [&_p]:text-issa-inverse-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_strong]:block [&_strong]:mt-1 [&_strong]:text-page-title [&_strong]:font-bold [&_strong]:leading-tight [&>span]:block [&>span]:mt-2 [&>span]:text-issa-inverse-muted [&>span]:text-supporting")}><p>Kelas aktif</p><strong>{className}</strong><span>Scope akses teacher</span></div>
      <dl className={tw("teacher-dashboard__class-facts grid sm:grid-cols-2 [&>div]:border-t [&>div]:border-issa-border [&>div]:p-4 [&>div:first-child]:border-t-0 sm:[&>div]:border-t-0 sm:[&>div+div]:border-l sm:[&>div+div]:border-issa-border [&_dt]:text-issa-muted [&_dt]:text-metadata [&_dt]:font-bold [&_dt]:tracking-metadata [&_dt]:uppercase [&_dd]:mt-2 [&_dd]:text-issa-text [&_dd]:text-section-title [&_dd]:font-bold [&_dd+span]:block [&_dd+span]:mt-2 [&_dd+span]:text-issa-muted [&_dd+span]:text-supporting")}>
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
      className={tw("teacher-dashboard__roster")}
      eyebrow="Daftar kelas"
      title="Daftar siswa"
      description="Buka detail untuk melanjutkan pencatatan perkembangan siswa."
    >
      <form className={tw("teacher-dashboard__search grid items-end gap-3 p-4 border-b border-issa-border sm:[grid-template-columns:minmax(14rem,_22rem)_auto] sm:[justify-content:end] [&_.teacher-dashboard__search-action_.issa-button]:w-full")} onSubmit={handleStudentSearchSubmit}>
          <TextField
            id="dashboard-student-search"
            label="Cari siswa"
            value={studentSearchQuery.name}
            onChange={(event) => setStudentSearchQuery({ name: event.target.value })}
            type="search"
            name="name"
            placeholder="Masukkan nama siswa"
          />
          <div className={tw("teacher-dashboard__search-action")}>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Mencari…" : "Cari"}
            </PrimaryButton>
          </div>
      </form>
      {loading && <div className={tw("teacher-dashboard__state p-4")}><LoadingState label="Memuat daftar siswa..." /></div>}
      {!loading && error && <div className={tw("teacher-dashboard__state p-4")}><ErrorState message={error} onRetry={() => fetchStudentListForDashboard(appliedStudentSearchQuery, currentPage)} /></div>}
      {!loading && !error && isEmpty(studentRows) && <div className={tw("teacher-dashboard__state p-4")}><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang cocok dengan pencarian ini." /></div>}
      {!loading && !error && !isEmpty(studentRows) && <>
        <div className={tw("teacher-dashboard__roster-overflow min-w-0")}><table className={tw("teacher-dashboard__roster-table w-full border-collapse text-issa-text text-table text-left [&_thead]:bg-issa-subtle [&_thead]:text-issa-muted [&_thead_th]:py-3 [&_thead_th]:px-4 [&_thead_th]:text-table-header [&_thead_th]:font-bold [&_thead_th]:tracking-metadata [&_thead_th]:uppercase max-sm:[&_thead]:hidden max-sm:[&_tbody]:grid")}><thead><tr><th>Siswa</th><th>NIM</th><th>Kelas</th><th>Attendance hari ini</th><th>Aksi</th></tr></thead><tbody>{studentRows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}</tbody></table></div>
        <div className={tw("teacher-dashboard__pagination border-t border-issa-border p-4")}>
          <div className={tw("flex items-center justify-between gap-3 max-sm:items-stretch max-sm:flex-col")}>
            <p className={tw("text-issa-muted text-supporting")}>
              Menampilkan {firstDisplayedStudent}–{lastDisplayedStudent} dari {totalStudents} siswa
              <span className={tw("teacher-dashboard__pagination-separator mx-2")} aria-hidden="true">·</span>
              Halaman {currentPage} dari {totalPages}
            </p>
            <FlowbitePagination
              aria-label="Paginasi siswa Dashboard"
              currentPage={currentPage}
              layout="navigation"
              nextLabel="Berikutnya"
              onPageChange={handleStudentPageChange}
              previousLabel="Sebelumnya"
              totalPages={totalPages}
            />
          </div>
        </div>
      </>}
    </LedgerShell>
  </PageContainer>;
}
