import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import groupBy from "lodash/groupBy";
import isEmpty from "lodash/isEmpty";
import ScheduleList from "../features/schedule/components/ScheduleList";
import { fetchClassSchedule } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from "../shared/ui/ui";
import "../features/schedule/schedule-workspace.css";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const schedules = useSelector((state) => state.schedules.schedules);
  const schedulesByDay = groupBy(schedules, "day");

  const fetchClassScheduleForTeacher = useCallback(() => {
    setLoading(true);
    setError("");
    return dispatch(fetchClassSchedule())
      .catch((requestError) => setError(requestError?.message || "Jadwal tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => { fetchClassScheduleForTeacher(); }, [fetchClassScheduleForTeacher]);

  if (loading) return <PageContainer><LoadingState label="Memuat jadwal kelas..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={fetchClassScheduleForTeacher} /></PageContainer>;

  return (
    <PageContainer className="schedule-workspace">
      <PageHeader eyebrow="Weekly schedule" title="Jadwal kelas" description="Daftar mata pelajaran per hari untuk kelas yang Anda ampu." />
      {isEmpty(schedules) ? <EmptyState title="Jadwal belum tersedia" description="Belum ada mata pelajaran yang dijadwalkan untuk kelas ini." /> : <ScheduleList days={days} schedulesByDay={schedulesByDay} />}
    </PageContainer>
  );
}
