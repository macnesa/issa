import { tw } from "../shared/ui/tw";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TeacherAttentionQueue from "../features/student-insights/components/TeacherAttentionQueue";
import baseUrl from "../config/api";
import {
  ButtonLink,
  ErrorState,
  LoadingState,
  PageContainer,
} from "../shared/ui/ui";
import { localDateValue } from "../utils/recordDates";
import { getActiveTeacherIdentity } from "../offline-workspace/authIdentity";
import Icon from "../shared/ui/Icon";
import { workflowOwners } from "../navigation/workflowRoutes";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function greetingForHour(hour) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function formattedToday() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function scheduleStart(schedule) {
  return schedule?.startTime || schedule?.time || schedule?.start_time || "";
}

function scheduleEnd(schedule) {
  return schedule?.endTime || schedule?.end_time || "";
}

function timeMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;
  return (Number(match[1]) * 60) + Number(match[2]);
}

async function readJson(response, fallback) {
  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }
  if (!response.ok) throw new Error(body?.msg || fallback);
  return body;
}

async function fetchStudentPage(pageIndex, signal) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex) });
  const response = await fetch(`${baseUrl}/students?${params.toString()}`, {
    headers: { access_token: localStorage.access_token },
    signal,
  });
  return readJson(response, "Konteks siswa hari ini tidak dapat dimuat.");
}

async function fetchAllTeacherStudents(signal) {
  const firstPage = await fetchStudentPage(1, signal);
  const totalPages = Math.max(Number(firstPage?.totalPages) || 1, 1);
  const remainingPages = totalPages > 1
    ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchStudentPage(index + 2, signal)))
    : [];
  const rows = [firstPage, ...remainingPages].flatMap((page) => Array.isArray(page?.rows) ? page.rows : []);
  return {
    rows,
    count: Math.max(Number(firstPage?.count) || rows.length, rows.length),
  };
}

async function fetchTeacherSchedule(signal) {
  const response = await fetch(`${baseUrl}/schedules`, {
    headers: { access_token: localStorage.access_token },
    signal,
  });
  const body = await readJson(response, "Jadwal hari ini tidak dapat dimuat.");
  return Array.isArray(body) ? body : [];
}

function WorkRow({ icon, label, detail, to, complete = false }) {
  if (complete) {
    return (
      <div className={tw("flex min-w-0 items-center gap-3 border-y border-issa-border py-4")}>
        <span className={tw("grid h-9 w-9 flex-none place-items-center rounded-lg bg-[color-mix(in_srgb,var(--issa-success)_10%,var(--issa-surface))] text-issa-success")}>
          <Icon name="check" className={tw("text-lg")} />
        </span>
        <div className={tw("min-w-0 flex-1")}>
          <strong className={tw("block text-supporting font-semibold text-issa-text")}>{label}</strong>
          <span className={tw("mt-0.5 block text-metadata text-issa-muted")}>{detail}</span>
        </div>
      </div>
    );
  }

  return (
    <ButtonLink
      to={to}
      tone="tertiary"
      className={tw("!flex !min-h-0 w-full !justify-start !rounded-none !border-x-0 !border-y !border-issa-border !bg-transparent !px-0 !py-4 !text-left !shadow-none hover:!bg-transparent")}
    >
      <span className={tw("grid h-9 w-9 flex-none place-items-center rounded-lg bg-issa-subtle text-issa-accent")}>
        <Icon name={icon} className={tw("text-lg")} />
      </span>
      <span className={tw("min-w-0 flex-1")}>
        <strong className={tw("block text-supporting font-semibold text-issa-text")}>{label}</strong>
        <span className={tw("mt-0.5 block text-metadata font-normal text-issa-muted")}>{detail}</span>
      </span>
      <span className={tw("flex-none text-metadata font-semibold text-issa-accent")}>Lanjutkan</span>
      <Icon name="arrow_forward" className={tw("flex-none text-base text-issa-muted")} />
    </ButtonLink>
  );
}

export default function Dashboard() {
  const requestControllerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const teacherName = getActiveTeacherIdentity()?.name?.trim();

  const loadTodayContext = useCallback(() => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestSequenceRef.current;
    requestControllerRef.current = controller;
    setLoading(true);
    setError("");

    return Promise.all([
      fetchAllTeacherStudents(controller.signal),
      fetchTeacherSchedule(controller.signal),
    ])
      .then(([studentResult, scheduleResult]) => {
        if (requestId !== requestSequenceRef.current) return;
        setStudents(studentResult.rows);
        setStudentCount(studentResult.count);
        setSchedules(scheduleResult);
      })
      .catch((requestError) => {
        if (requestError?.name === "AbortError" || requestId !== requestSequenceRef.current) return;
        setError(requestError.message || "Konteks hari ini tidak dapat dimuat.");
      })
      .finally(() => {
        if (requestId !== requestSequenceRef.current) return;
        setLoading(false);
        if (requestControllerRef.current === controller) requestControllerRef.current = null;
      });
  }, []);

  useEffect(() => {
    loadTodayContext();
    return () => {
      requestSequenceRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [loadTodayContext]);

  const todayValue = localDateValue();
  const className = students[0]?.Class?.name || "Kelas Anda";
  const attendanceRecordedToday = students.filter((student) => (
    (student.Attendances || []).some((attendance) => attendance.attendanceDate === todayValue)
  )).length;
  const attendanceComplete = studentCount > 0 && attendanceRecordedToday >= studentCount;
  const attendanceLabel = studentCount === 0
    ? "Belum ada siswa dalam cakupan kelas"
    : attendanceComplete
      ? `${studentCount} siswa sudah dicatat`
      : `${attendanceRecordedToday} dari ${studentCount} siswa sudah dicatat`;
  const todaySchedule = useMemo(
    () => schedules
      .filter((schedule) => schedule.day === dayNames[new Date().getDay()])
      .slice()
      .sort((a, b) => timeMinutes(scheduleStart(a)) - timeMinutes(scheduleStart(b))),
    [schedules]
  );
  const currentMinutes = (new Date().getHours() * 60) + new Date().getMinutes();
  const upcomingSchedule = todaySchedule.filter((schedule) => {
    const minutes = timeMinutes(scheduleStart(schedule));
    return !Number.isFinite(minutes) || minutes >= currentMinutes;
  });
  const nextSchedule = upcomingSchedule.slice(0, 3);

  return (
    <PageContainer className={tw("today-workspace")}>
      <header className={tw("today-hero grid gap-5 border-b border-issa-border pb-6 lg:[grid-template-columns:minmax(0,_1fr)_auto] lg:items-end")}>
        <div className={tw("min-w-0")}>
          <p className={tw("text-supporting font-medium text-issa-muted")}>{formattedToday()}</p>
          <h1 className={tw("mt-1.5 text-[clamp(1.65rem,2.1vw,2.25rem)] font-semibold tracking-title text-issa-text")}>
            {greetingForHour(new Date().getHours())}{teacherName ? `, ${teacherName}` : ""}
          </h1>
          <div className={tw("mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-supporting text-issa-muted")}>
            <ButtonLink to={workflowOwners.class} tone="tertiary" compact className={tw("!min-h-0 !p-0 !font-semibold !text-issa-text hover:!bg-transparent hover:!text-issa-accent")}>{className}</ButtonLink>
            <span aria-hidden="true">·</span>
            <span>{studentCount} siswa</span>
          </div>
        </div>
        <ButtonLink tone="primary" to={workflowOwners.classCapture} className={tw("max-lg:hidden")}>
          <Icon name="add" /> Catat kelas
        </ButtonLink>
      </header>

      {loading && <div className={tw("mt-6")}><LoadingState label="Memuat konteks hari ini..." /></div>}
      {!loading && error && <div className={tw("mt-6")}><ErrorState message={error} onRetry={loadTodayContext} /></div>}

      {!loading && !error && (
        <>
          <section className={tw("grid gap-8 border-b border-issa-border py-7 xl:[grid-template-columns:minmax(0,_0.95fr)_minmax(20rem,_1.05fr)] xl:gap-12")} aria-label="Pekerjaan hari ini">
            <div className={tw("min-w-0")}>
              <div className={tw("mb-3")}>
                <p className={tw("text-eyebrow font-semibold text-issa-muted")}>{attendanceComplete ? "Selesai" : "Belum selesai"}</p>
                <h2 className={tw("mt-1 text-section-title font-semibold text-issa-text")}>Kehadiran</h2>
              </div>
              <WorkRow
                icon="fact_check"
                label={attendanceComplete ? "Kehadiran hari ini selesai" : "Lengkapi kehadiran hari ini"}
                detail={attendanceLabel}
                to={workflowOwners.classAttendance}
                complete={attendanceComplete}
              />
            </div>

            <div className={tw("min-w-0 xl:border-l xl:border-issa-border xl:pl-10")}>
              <div className={tw("mb-3 flex items-baseline justify-between gap-4")}>
                <div>
                  <p className={tw("text-eyebrow font-semibold text-issa-muted")}>Berikutnya</p>
                  <h2 className={tw("mt-1 text-section-title font-semibold text-issa-text")}>Jadwal hari ini</h2>
                </div>
                <ButtonLink to={workflowOwners.classSchedule} tone="tertiary" compact>Lihat minggu</ButtonLink>
              </div>

              {nextSchedule.length ? (
                <ol className={tw("m-0 list-none border-y border-issa-border p-0")}>
                  {nextSchedule.map((schedule, index) => (
                    <li key={schedule.id || index} className={tw("grid min-w-0 gap-2 py-3.5 [&+&]:border-t [&+&]:border-issa-border sm:[grid-template-columns:7rem_minmax(0,_1fr)]")}>
                      <span className={tw("text-metadata font-semibold tabular-nums text-issa-muted")}>{scheduleStart(schedule) || "—"}{scheduleEnd(schedule) ? `–${scheduleEnd(schedule)}` : ""}</span>
                      <div className={tw("min-w-0")}>
                        <strong className={tw("block text-supporting font-semibold text-issa-text")}>{schedule.Lesson?.name || schedule.name || "Pelajaran"}</strong>
                        {schedule.Teacher?.name && <span className={tw("mt-0.5 block text-metadata text-issa-muted")}>{schedule.Teacher.name}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={tw("border-y border-issa-border py-4")}>
                  <strong className={tw("block text-supporting font-semibold text-issa-text")}>{todaySchedule.length ? "Tidak ada sesi berikutnya hari ini" : "Tidak ada sesi terjadwal hari ini"}</strong>
                  <p className={tw("mt-1 text-metadata text-issa-muted")}>Buka jadwal mingguan untuk melihat sesi berikutnya.</p>
                </div>
              )}
            </div>
          </section>

          <section className={tw("today-attention pt-7")}>
            <TeacherAttentionQueue />
          </section>
        </>
      )}
    </PageContainer>
  );
}
