import { tw } from "../shared/ui/tw";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchClassSchedule, fetchStudentList } from "../store/action/ActionCreator";
import ClassWorkspaceNav from "../features/class/ClassWorkspaceNav";
import {
  ButtonLink,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageContainer,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "../shared/ui/ui";
import Icon from "../shared/ui/Icon";
import { localDateValue } from "../utils/recordDates";
import { workflowOwners } from "../navigation/workflowRoutes";

const weekdayByIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function scheduleTime(schedule) {
  return schedule?.time || schedule?.startTime || schedule?.start_time || "";
}

export default function ClassWorkspace() {
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const schedules = useSelector((state) => state.schedules.schedules);
  const [loading, setLoading] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const loadContext = useCallback(async () => {
    setLoading(true);
    setStudentError("");
    setScheduleError("");

    const [studentResult, scheduleResult] = await Promise.allSettled([
      dispatch(fetchStudentList({}, 1, { requestKey: "class-workspace-students" })),
      dispatch(fetchClassSchedule()),
    ]);

    if (studentResult.status === "rejected") {
      setStudentError(studentResult.reason?.message || "Daftar siswa belum dapat dimuat.");
    }
    if (scheduleResult.status === "rejected") {
      setScheduleError(scheduleResult.reason?.message || "Jadwal belum dapat dimuat.");
    }
    setLoading(false);
  }, [dispatch]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const rows = Array.isArray(students?.rows) ? students.rows : [];
  const scheduleRows = Array.isArray(schedules) ? schedules : [];
  const className = rows.find((student) => student?.Class?.name)?.Class?.name
    || scheduleRows.find((schedule) => schedule?.Class?.name)?.Class?.name
    || "Kelas aktif";
  const studentCount = Number(students?.count) || rows.length;
  const todayKey = weekdayByIndex[new Date().getDay()];
  const todaySchedules = useMemo(
    () => scheduleRows.filter((schedule) => schedule?.day === todayKey),
    [scheduleRows, todayKey]
  );
  const previewStudents = rows.slice(0, 6);

  if (loading) {
    return <PageContainer><LoadingState label="Memuat konteks kelas..." /></PageContainer>;
  }

  return (
    <PageContainer className={tw("class-overview-workspace text-issa-text")}>
      <PageHeader
        eyebrow="Kelas"
        title={className}
        metadata={studentCount > 0 ? `${studentCount} siswa` : undefined}
      />
      <ClassWorkspaceNav />

      {(studentError || scheduleError) && (
        <div className={tw("mb-6 grid gap-2")}>
          {studentError && <InlineNotice tone="warning">{studentError}</InlineNotice>}
          {scheduleError && <InlineNotice tone="warning">{scheduleError}</InlineNotice>}
        </div>
      )}

      <div className={tw("grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] xl:gap-14")}>
        <section className={tw("min-w-0")} aria-labelledby="class-today-title">
          <SectionHeader
            eyebrow="Hari ini"
            title="Jadwal & kehadiran"
            id="class-today-title"
          />

          <div className={tw("border-y border-issa-border")}>
            <Link
              to={workflowOwners.classAttendance}
              className={tw("group flex min-w-0 items-center gap-4 py-4 text-issa-text transition-colors duration-fast hover:text-issa-accent focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus")}
            >
              <span className={tw("grid h-10 w-10 flex-none place-items-center rounded-control bg-issa-subtle text-issa-accent")}>
                <Icon name="fact_check" />
              </span>
              <span className={tw("min-w-0 flex-1")}>
                <strong className={tw("block text-body font-semibold")}>Kehadiran</strong>
                <span className={tw("mt-0.5 block text-supporting text-issa-muted")}>Buka daftar kelas dan tandai status hari ini.</span>
              </span>
              <Icon name="arrow_forward" className={tw("flex-none text-issa-muted transition-transform duration-fast group-hover:translate-x-0.5 motion-reduce:transition-none")} />
            </Link>

            <div className={tw("border-t border-issa-border py-4")}>
              <div className={tw("mb-3 flex items-center justify-between gap-3")}>
                <div>
                  <strong className={tw("block text-body font-semibold")}>Jadwal hari ini</strong>
                  <span className={tw("text-supporting text-issa-muted")}>{todaySchedules.length ? `${todaySchedules.length} sesi` : "Tidak ada sesi terjadwal"}</span>
                </div>
                <Link className={tw("text-supporting font-semibold text-issa-accent hover:underline focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")} to={workflowOwners.classSchedule}>Lihat minggu</Link>
              </div>

              {todaySchedules.length > 0 ? (
                <ol className={tw("m-0 grid list-none gap-0 p-0")}>
                  {todaySchedules.map((schedule, index) => (
                    <li key={schedule.id || `${schedule.day}-${index}`} className={tw("flex min-w-0 items-start gap-4 py-3 [&+&]:border-t [&+&]:border-issa-border")}>
                      <time className={tw("w-16 flex-none text-metadata font-semibold tabular-nums text-issa-muted")}>{scheduleTime(schedule) || "—"}</time>
                      <div className={tw("min-w-0 flex-1")}>
                        <strong className={tw("block truncate text-supporting font-semibold text-issa-text")}>{schedule?.Lesson?.name || schedule?.lesson?.name || schedule?.subject || "Pelajaran"}</strong>
                        {(schedule?.Teacher?.name || schedule?.teacher?.name) && <span className={tw("mt-0.5 block truncate text-metadata text-issa-muted")}>{schedule?.Teacher?.name || schedule?.teacher?.name}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={tw("py-4 text-supporting text-issa-muted")}>Belum ada jadwal kelas untuk hari ini.</p>
              )}
            </div>
          </div>
        </section>

        <section className={tw("min-w-0")} aria-labelledby="class-roster-title">
          <SectionHeader
            title={studentCount > 0 ? `Roster · ${studentCount} siswa` : "Roster"}
            id="class-roster-title"
            actions={<ButtonLink to={workflowOwners.students} compact>Lihat semua</ButtonLink>}
          />

          {previewStudents.length === 0 ? (
            <EmptyState title="Roster belum tersedia" description="Daftar siswa akan muncul ketika data kelas berhasil dimuat." />
          ) : (
            <ol className={tw("m-0 list-none border-y border-issa-border p-0")}>
              {previewStudents.map((student) => {
                const todayAttendance = (student.Attendances || []).find((attendance) => attendance.attendanceDate === localDateValue());
                return (
                <li key={student.id} className={tw("[&+&]:border-t [&+&]:border-issa-border")}>
                  <Link
                    to={`/students/${student.id}`}
                    className={tw("group flex min-w-0 items-center gap-3 py-3.5 focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus")}
                  >
                    <span className={tw("grid h-9 w-9 flex-none place-items-center rounded-full bg-issa-subtle text-metadata font-semibold text-issa-accent")} aria-hidden="true">
                      {(student.name || "S").trim().slice(0, 1).toUpperCase()}
                    </span>
                    <span className={tw("min-w-0 flex-1")}>
                      <strong className={tw("block truncate text-supporting font-semibold text-issa-text group-hover:text-issa-accent")}>{student.name}</strong>
                      {student.NIM && <span className={tw("mt-0.5 block truncate text-metadata text-issa-muted")}>{student.NIM}</span>}
                    </span>
                    <StatusBadge status={todayAttendance?.status || "Belum dicatat"} />
                  </Link>
                </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
