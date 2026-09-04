import { tw } from "../shared/ui/tw";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import groupBy from "lodash/groupBy";
import isEmpty from "lodash/isEmpty";
import ScheduleList from "../features/schedule/components/ScheduleList";
import { fetchClassSchedule, fetchStudentList } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from "../shared/ui/ui";
import ClassWorkspaceNav from "../features/class/ClassWorkspaceNav";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const schedules = useSelector((state) => state.schedules.schedules);
  const students = useSelector((state) => state.students.students);
  const studentRows = Array.isArray(students?.rows) ? students.rows : [];
  const schedulesByDay = groupBy(schedules, "day");
  const activeClassName = schedules.find((schedule) => schedule?.Class?.name)?.Class?.name
    || studentRows.find((student) => student?.Class?.name)?.Class?.name
    || "Kelas aktif";

  const fetchClassScheduleForTeacher = useCallback(() => {
    setLoading(true);
    setError("");
    return dispatch(fetchClassSchedule())
      .catch((requestError) => setError(requestError?.message || "Jadwal tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    fetchClassScheduleForTeacher();
    dispatch(fetchStudentList({}, 1, { requestKey: "schedule-class-context" })).catch(() => {});
  }, [dispatch, fetchClassScheduleForTeacher]);

  if (loading) return <PageContainer><LoadingState label="Memuat jadwal kelas..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={fetchClassScheduleForTeacher} /></PageContainer>;

  return (
    <PageContainer className={tw("schedule-workspace text-issa-text")}>
      <PageHeader eyebrow={activeClassName} title="Jadwal" description="Ritme kelas sepanjang minggu dalam konteks kelas yang sama dengan kehadiran." />
      <ClassWorkspaceNav />
      {isEmpty(schedules) ? <EmptyState title="Jadwal belum tersedia" description="Belum ada mata pelajaran yang dijadwalkan untuk kelas ini." /> : <ScheduleList days={days} schedulesByDay={schedulesByDay} />}
    </PageContainer>
  );
}
