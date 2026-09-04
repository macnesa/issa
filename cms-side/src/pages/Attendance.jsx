import { tw } from "../shared/ui/tw";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "lodash/isEmpty";
import TableAttendances from "../features/attendance/components/TableAttendance";
import { fetchStudentList } from "../store/action/ActionCreator";
import Pagination from "../features/students/components/Pagination";
import { localDateValue } from "../utils/recordDates";
import {
  EmptyState,
  ErrorState,
  LedgerShell,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryButton,
} from "../shared/ui/ui";
import DateField from "../shared/ui/form-controls/DateField";
import TextField from "../shared/ui/form-controls/TextField";
import ClassWorkspaceNav from "../features/class/ClassWorkspaceNav";

export default function Attendance() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const students = useSelector((state) => state.students.students);
  const requestControllerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialStudentName = searchParams.get("name")?.trim() || "";
  const focusedStudentId = searchParams.get("studentId")?.trim() || searchParams.get("student")?.trim() || "";
  const requestedAttendanceDate = searchParams.get("date")?.trim() || "";
  const initialAttendanceDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedAttendanceDate)
    ? requestedAttendanceDate
    : localDateValue();
  const [query, setQuery] = useState({ name: initialStudentName });
  const [appliedQuery, setAppliedQuery] = useState({ name: initialStudentName });
  const [attendanceDate, setAttendanceDate] = useState(initialAttendanceDate);

  const rows = Array.isArray(students.rows) ? students.rows : [];
  const totalPages = Math.max(Number(students.totalPages) || 1, 1);
  const currentPage = Math.min(Math.max(Number(students.page) || 1, 1), totalPages);

  const fetchStudentListForAttendance = (studentSearchQuery = appliedQuery, pageIndex = 1) => {
    requestControllerRef.current?.abort();
    const requestController = new AbortController();
    const requestId = ++requestSequenceRef.current;
    requestControllerRef.current = requestController;
    setLoading(true);
    setError("");

    return dispatch(fetchStudentList(
      studentSearchQuery,
      pageIndex,
      { signal: requestController.signal, requestKey: "attendance-student-list" }
    ))
      .catch((requestError) => {
        if (requestError?.name === "AbortError" || requestId !== requestSequenceRef.current) return undefined;
        setError(requestError.message || "Kehadiran siswa tidak dapat dimuat.");
        return undefined;
      })
      .finally(() => {
        if (requestId !== requestSequenceRef.current) return;
        setLoading(false);
        if (requestControllerRef.current === requestController) requestControllerRef.current = null;
      });
  };

  useEffect(() => {
    setAttendanceDate(initialAttendanceDate);
  }, [initialAttendanceDate]);

  useEffect(() => {
    const nextQuery = initialStudentName ? { name: initialStudentName } : {};
    setQuery({ name: initialStudentName });
    setAppliedQuery({ name: initialStudentName });
    fetchStudentListForAttendance(nextQuery, 1);
    return () => {
      requestSequenceRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [dispatch, initialStudentName]);

  useEffect(() => {
    if (loading || !focusedStudentId) return;
    const focusedRow = document.getElementById(`attendance-student-${focusedStudentId}`);
    if (!focusedRow) return;
    window.requestAnimationFrame(() => {
      focusedRow.scrollIntoView({ block: "center" });
    });
  }, [focusedStudentId, loading, rows]);

  const handleStudentSearchSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    const nextQuery = { name: query.name.trim() };
    setAppliedQuery(nextQuery);
    fetchStudentListForAttendance(nextQuery, 1);
  };

  const handleStudentPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    fetchStudentListForAttendance(appliedQuery, nextPage);
  };

  const handleAttendanceSaved = () => fetchStudentListForAttendance(appliedQuery, currentPage);

  const activeClassName = rows[0]?.Class?.name || "Kelas aktif";

  return (
    <PageContainer className={tw("attendance-workspace text-issa-text")}>
      <PageHeader eyebrow={activeClassName} title="Kehadiran" description="Tandai kehadiran dengan cepat dalam konteks kelas yang sama." />
      <ClassWorkspaceNav />
      <LedgerShell className={tw("attendance-register")}>
        <form
          onSubmit={handleStudentSearchSubmit}
          className={tw("attendance-register__toolbar grid items-end gap-3 border-b border-issa-border bg-transparent px-0 py-4 md:[grid-template-columns:14rem_minmax(0,_1fr)_auto] [&>.issa-button]:w-full")}
        >
          <DateField id="attendance-date" className={tw("attendance-register__date-field")} label="Tanggal aktif" value={attendanceDate} onChange={setAttendanceDate} required />
          <TextField id="attendance-student-search" className={tw("attendance-register__search-field")} label="Cari siswa" value={query.name} onChange={(event) => setQuery({ name: event.target.value })} type="search" name="name" placeholder="Cari nama siswa" />
          <PrimaryButton type="submit" disabled={loading}>{loading ? "Mencari…" : "Cari"}</PrimaryButton>
        </form>

        {loading && <div className={tw("attendance-register__state py-5")}><LoadingState label="Memuat kehadiran siswa..." /></div>}
        {!loading && error && <div className={tw("attendance-register__state py-5")}><ErrorState message={error} onRetry={() => fetchStudentListForAttendance(appliedQuery, currentPage)} /></div>}
        {!loading && !error && isEmpty(rows) && <div className={tw("attendance-register__state py-5")}><EmptyState title="Belum ada siswa" description="Tidak ada siswa yang dapat ditampilkan untuk pencarian ini." /></div>}
        {!loading && !error && !isEmpty(rows) && (
          <>
            <div className={tw("attendance-register__records min-w-0")}>
              <table className={tw("attendance-register__table w-full min-w-0 border-collapse text-left text-table text-issa-text [&_thead]:bg-transparent [&_thead]:text-issa-muted [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-table-header [&_thead_th]:font-semibold max-lg:[&_thead]:hidden max-lg:[&_tbody]:grid")}>
                <thead><tr><th>Siswa</th><th>Kelas</th><th>Status · {attendanceDate}</th><th className={tw("text-right")}>Catatan</th></tr></thead>
                <tbody>
                  {rows.map((student) => (
                    <TableAttendances
                      key={student.id}
                      data={student}
                      attendanceDate={attendanceDate}
                      focused={Boolean(focusedStudentId) && String(student.id) === String(focusedStudentId)}
                      onAttendanceSaved={handleAttendanceSaved}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className={tw("attendance-register__footer border-t border-issa-border px-0 py-4 bg-transparent")}>
              <Pagination data={students} onPageChange={handleStudentPageChange} />
            </div>
          </>
        )}
      </LedgerShell>
    </PageContainer>
  );
}
