import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { scheduleFetch } from "../store/action/ActionCreator";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, Surface } from "../components/ui";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const schedules = useSelector((state) => state.schedules.schedules);

  const loadSchedule = useCallback(() => {
    setLoading(true);
    setError("");
    return dispatch(scheduleFetch())
      .catch((requestError) => setError(requestError?.message || "Jadwal tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  if (loading) return <PageContainer><LoadingState label="Memuat jadwal kelas..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={loadSchedule} /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader eyebrow="Kelas saya" title="Jadwal kelas" description="Daftar mata pelajaran per hari untuk kelas yang Anda ampu." />
      {!schedules?.length ? <EmptyState title="Jadwal belum tersedia" description="Belum ada mata pelajaran yang dijadwalkan untuk kelas ini." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{days.map((day) => {
        const entries = schedules.filter((schedule) => schedule.day === day);
        return <Surface key={day} className="p-5"><h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{day}</h2>{entries.length ? <ul className="mt-4 divide-y divide-[var(--border)]">{entries.map((schedule) => <li key={schedule.id} className="py-3 first:pt-0 last:pb-0"><p className="font-medium text-[var(--text)]">{schedule.Lesson?.name || "Mata pelajaran belum tersedia"}</p><p className="mt-1 text-sm text-[var(--muted)]">{schedule.Lesson?.KKM != null ? `KKM ${schedule.Lesson.KKM}` : "Detail KKM belum tersedia"}</p></li>)}</ul> : <p className="mt-4 text-sm text-[var(--muted)]">Belum ada mata pelajaran.</p>}</Surface>;
      })}</div>}
    </PageContainer>
  );
}
