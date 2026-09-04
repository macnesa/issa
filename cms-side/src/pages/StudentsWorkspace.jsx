import { tw } from "../shared/ui/tw";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Pagination as FlowbitePagination } from "flowbite-react/components/Pagination";
import { fetchStudentList } from "../store/action/ActionCreator";
import { localDateValue } from "../utils/recordDates";
import TextField from "../shared/ui/form-controls/TextField";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PrimaryButton,
  StatusBadge,
} from "../shared/ui/ui";
import Icon from "../shared/ui/Icon";
import StudentDetail from "./AddStudent";

const workspaceViews = new Set(["summary", "timeline", "assessment"]);

function canonicalStudentPath(studentId, workspace = "summary") {
  if (!studentId) return "/students";
  const suffix = workspace !== "summary" ? `?view=${workspace}` : "";
  return `/students/${studentId}${suffix}`;
}

function StudentListItem({ student, selected, to, itemRef }) {
  const attendanceToday = (student.Attendances || []).find(
    (attendance) => attendance.attendanceDate === localDateValue()
  );

  return (
    <Link
      ref={itemRef}
      to={to}
      data-student-record-link="true"
      aria-current={selected ? "page" : undefined}
      className={tw(
        "group grid w-full min-w-0 grid-cols-[2.5rem_minmax(0,_1fr)_auto] items-center gap-3 border-b border-issa-border px-3 py-3 text-left transition-colors duration-fast hover:bg-issa-subtle focus-visible:z-[1] focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus motion-reduce:transition-none",
        selected && "bg-issa-subtle"
      )}
    >
      {student.imgUrl ? (
        <img className={tw("h-10 w-10 rounded-lg bg-issa-subtle object-cover ring-1 ring-issa-border")} src={student.imgUrl} alt="" />
      ) : (
        <span className={tw("grid h-10 w-10 place-items-center rounded-lg bg-issa-subtle text-supporting font-semibold text-issa-text ring-1 ring-issa-border")} aria-hidden="true">
          {String(student.name || "S").slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className={tw("min-w-0")}>
        <strong className={tw("block truncate text-supporting font-semibold text-issa-text")}>{student.name}</strong>
        <span className={tw("mt-0.5 block truncate text-metadata text-issa-muted")}>{student.Class?.name || "Kelas —"} · {student.NIM || "NIM —"}</span>
      </span>
      <span className={tw("flex items-center gap-2")}>
        <StatusBadge status={attendanceToday?.status} />
        <Icon name="chevron_right" className={tw("hidden text-base text-issa-muted lg:block", selected && "text-issa-accent")} />
      </span>
    </Link>
  );
}

export default function StudentsWorkspace({ initialWorkspace = "summary" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const students = useSelector((state) => state.students.students);
  const [query, setQuery] = useState({ name: "" });
  const [appliedQuery, setAppliedQuery] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestControllerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const itemRefs = useRef([]);
  const mobileBackRef = useRef(null);

  const requestedWorkspace = searchParams.get("view");
  const activeWorkspace = workspaceViews.has(requestedWorkspace)
    ? requestedWorkspace
    : workspaceViews.has(initialWorkspace)
      ? initialWorkspace
      : "summary";

  const rows = Array.isArray(students?.rows) ? students.rows : [];
  const totalStudents = Math.max(Number(students?.count) || 0, 0);
  const totalPages = Math.max(Number(students?.totalPages) || 1, 1);
  const currentPage = Math.min(Math.max(Number(students?.page) || 1, 1), totalPages);
  const selectedIndex = rows.findIndex((student) => String(student.id) === String(studentId));
  const className = rows[0]?.Class?.name || "Kelas Anda";
  const recordPath = (id, workspace = activeWorkspace) => canonicalStudentPath(id, workspace);

  const loadStudents = (nextQuery = {}, page = 1) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestSequenceRef.current;
    requestControllerRef.current = controller;
    setLoading(true);
    setError("");

    return dispatch(fetchStudentList(nextQuery, page, {
      signal: controller.signal,
      requestKey: "students-workspace-list",
    }))
      .then((response) => {
        if (requestId !== requestSequenceRef.current) return response;
        return response;
      })
      .catch((requestError) => {
        if (requestError?.name === "AbortError" || requestId !== requestSequenceRef.current) return undefined;
        setError(requestError.message || "Daftar siswa tidak dapat dimuat.");
        return undefined;
      })
      .finally(() => {
        if (requestId !== requestSequenceRef.current) return;
        setLoading(false);
        if (requestControllerRef.current === controller) requestControllerRef.current = null;
      });
  };

  useEffect(() => {
    loadStudents({}, 1);
    return () => {
      requestSequenceRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!studentId || !mobileBackRef.current) return;
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 1023px)").matches) return;
    window.requestAnimationFrame(() => mobileBackRef.current?.focus());
  }, [studentId]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (loading) return;
    const next = { name: query.name.trim() };
    setAppliedQuery(next);
    loadStudents(next, 1);
  };

  const handleListKeyDown = (event) => {
    if (!event.target.closest?.("[data-student-record-link='true']")) return;
    if (!rows.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = selectedIndex >= 0 ? selectedIndex : rows.findIndex((student) => String(student.id) === String(event.target.dataset?.studentId));
    if (nextIndex < 0) nextIndex = 0;
    if (event.key === "ArrowDown") nextIndex = Math.min(nextIndex + 1, rows.length - 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(nextIndex - 1, 0);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = rows.length - 1;
    const nextStudent = rows[nextIndex];
    if (nextStudent?.id) {
      navigate(recordPath(nextStudent.id));
      window.requestAnimationFrame(() => itemRefs.current[nextIndex]?.focus());
    }
  };

  const handleWorkspaceChange = (workspace) => {
    if (!studentId || !workspaceViews.has(workspace)) return;
    navigate(recordPath(studentId, workspace));
  };

  const handleMobileBack = () => {
    const returnIndex = selectedIndex;
    const rosterPath = activeWorkspace === "summary" ? "/students" : `/students?view=${activeWorkspace}`;
    navigate(rosterPath);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => itemRefs.current[returnIndex]?.focus());
    });
  };

  const listState = useMemo(() => {
    if (loading) return <LoadingState label="Memuat siswa..." />;
    if (error) return <ErrorState message={error} onRetry={() => loadStudents(appliedQuery, currentPage)} />;
    if (!rows.length) return <EmptyState title="Tidak ada siswa" description="Ubah pencarian atau periksa cakupan kelas guru." />;
    return null;
  }, [loading, error, rows.length, appliedQuery, currentPage]);

  return (
    <PageContainer className={tw("students-workspace !max-w-none !px-0 !py-0")}>
      <div className={tw("lg:grid lg:min-h-[calc(100dvh-var(--teacher-utility-height))] lg:[grid-template-columns:minmax(17rem,_21rem)_minmax(0,_1fr)]")}>
        <aside
          className={tw("students-workspace__index min-w-0 border-issa-border bg-[color-mix(in_srgb,var(--issa-surface)_52%,var(--issa-page))] lg:sticky lg:top-[var(--teacher-utility-height)] lg:flex lg:h-[calc(100dvh-var(--teacher-utility-height))] lg:flex-col lg:overflow-hidden lg:border-r", studentId && "max-lg:hidden")}
          aria-label="Daftar siswa"
          onKeyDown={handleListKeyDown}
        >
          <header className={tw("border-b border-issa-border px-4 pb-4 pt-5")}>
            <div className={tw("flex items-end justify-between gap-4")}>
              <div>
                <p className={tw("text-eyebrow font-semibold text-issa-muted")}>Siswa</p>
                {studentId ? (
                  <h2 className={tw("mt-1 text-page-title font-semibold tracking-title text-issa-text")}>{className}</h2>
                ) : (
                  <h1 className={tw("mt-1 text-page-title font-semibold tracking-title text-issa-text")}>{className}</h1>
                )}
              </div>
              <span className={tw("pb-1 text-metadata font-semibold tabular-nums text-issa-muted")}>{totalStudents}</span>
            </div>
            <form className={tw("mt-4 grid grid-cols-[minmax(0,_1fr)_auto] items-end gap-2")} onSubmit={handleSearch}>
              <TextField
                id="students-workspace-search"
                label="Cari siswa"
                value={query.name}
                onChange={(event) => setQuery({ name: event.target.value })}
                type="search"
                name="name"
                placeholder="Nama siswa"
              />
              <PrimaryButton type="submit" compact disabled={loading} aria-label="Cari siswa">
                <Icon name="search" />
              </PrimaryButton>
            </form>
          </header>

          <div className={tw("min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto")}>
            {listState || rows.map((student, index) => (
              <StudentListItem
                key={student.id}
                student={student}
                selected={String(student.id) === String(studentId)}
                to={recordPath(student.id)}
                itemRef={(node) => {
                  itemRefs.current[index] = node;
                  if (node) node.dataset.studentId = String(student.id);
                }}
              />
            ))}
          </div>

          {!loading && !error && rows.length > 0 && totalPages > 1 && (
            <div className={tw("border-t border-issa-border bg-issa-page px-3 py-3")}>
              <FlowbitePagination
                aria-label="Paginasi siswa"
                currentPage={currentPage}
                layout="navigation"
                nextLabel="Berikutnya"
                previousLabel="Sebelumnya"
                totalPages={totalPages}
                onPageChange={(page) => loadStudents(appliedQuery, page)}
              />
            </div>
          )}
        </aside>

        <section className={tw("students-workspace__record min-w-0 bg-issa-page")}>
          {studentId ? (
            <>
              <div className={tw("hidden border-b border-issa-border px-4 py-2.5 max-lg:flex")}>
                <button ref={mobileBackRef} type="button" className={tw("inline-flex min-h-control items-center gap-2 rounded-control px-2 text-button font-semibold text-issa-text hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")} onClick={handleMobileBack}>
                  <Icon name="arrow_back" /> Siswa
                </button>
              </div>
              <StudentDetail
                embedded
                studentIdOverride={studentId}
                initialWorkspace={activeWorkspace}
                activeWorkspaceOverride={activeWorkspace}
                onWorkspaceChange={handleWorkspaceChange}
              />
            </>
          ) : (
            <div className={tw("grid min-h-[60vh] place-items-center p-8")}>
              <EmptyState title="Pilih siswa" description="Pilih siswa dari daftar untuk membuka data siswa tanpa kehilangan konteks kelas." />
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
