import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { createAttendanceRecord } from "../../../store/action/ActionCreator";
import ModalAttendances from "./ModalAttendances";
import { attendanceSyncLabels, useAttendanceOfflineRecords } from "../../../offline-workspace/attendanceOffline";
import { useOfflineWorkspace } from "../../../offline-workspace/OfflineWorkspaceProvider";

const attendanceStatuses = [
  { value: "Hadir", active: "border-issa-success bg-[color-mix(in_srgb,var(--issa-success)_9%,var(--issa-surface))] text-issa-success" },
  { value: "Sakit", active: "border-issa-warning bg-[color-mix(in_srgb,var(--issa-warning)_9%,var(--issa-surface))] text-issa-warning" },
  { value: "Izin", active: "border-issa-info bg-[color-mix(in_srgb,var(--issa-info)_8%,var(--issa-surface))] text-issa-info" },
  { value: "Alfa", active: "border-issa-danger bg-[color-mix(in_srgb,var(--issa-danger)_8%,var(--issa-surface))] text-issa-danger" },
];

export default function TableAttendances({ data, attendanceDate, onAttendanceSaved, focused = false }) {
  const dispatch = useDispatch();
  const workspace = useOfflineWorkspace();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selectedAttendance = (data.Attendances || []).find((attendance) => attendance.attendanceDate === attendanceDate);
  const attendanceWorkspace = useAttendanceOfflineRecords({
    teacherId: workspace.teacherIdentity?.id,
    studentId: data.id,
    serverRecords: selectedAttendance ? [selectedAttendance] : [],
  });
  const effectiveAttendance = attendanceWorkspace.records[0] || selectedAttendance;

  const handleAttendanceStatusChange = (status) => {
    if (workspace.isDemo) {
      setMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }
    if (!attendanceStatuses.some((item) => item.value === status)) return;
    if (selectedAttendance) {
      attendanceWorkspace.updateAttendance(effectiveAttendance, status).catch(() => {});
      return;
    }
    if (!workspace.connectionAvailable) {
      setMessage("Kehadiran baru hanya dapat dicatat saat online.");
      return;
    }
    const attendanceRequest = createAttendanceRecord({ StudentId: data.id, status, attendanceDate });
    setPending(true);
    setMessage("");
    dispatch(attendanceRequest)
      .then(() => {
        setMessage("Kehadiran dicatat.");
        return onAttendanceSaved?.();
      })
      .catch((error) => setMessage(error.message || "Kehadiran gagal diperbarui."))
      .finally(() => setPending(false));
  };

  const attendanceBusy = pending
    || attendanceWorkspace.savingEntityKey === effectiveAttendance?.entityKey
    || effectiveAttendance?.syncState === "syncing"
    || effectiveAttendance?.syncState === "conflict";
  const syncMessage = effectiveAttendance ? attendanceSyncLabels[effectiveAttendance.syncState] : "";

  return (
    <tr
      id={`attendance-student-${data.id}`}
      data-focused={focused ? "true" : "false"}
      className={tw(
        "attendance-register__row border-t border-issa-border bg-transparent align-top transition-colors duration-fast hover:bg-[color-mix(in_srgb,var(--issa-surface-subtle)_55%,transparent)] [&>th]:px-4 [&>th]:py-3.5 [&>td]:px-4 [&>td]:py-3.5 max-lg:grid max-lg:[grid-template-columns:minmax(0,_1fr)_auto] max-lg:gap-x-4 max-lg:gap-y-3 max-lg:px-4 max-lg:py-4 max-lg:[&>th]:min-w-0 max-lg:[&>td]:min-w-0 max-lg:[&>th]:p-0 max-lg:[&>td]:p-0 max-sm:grid-cols-1 motion-reduce:transition-none",
        focused && "bg-[color-mix(in_srgb,var(--issa-selection)_38%,transparent)] ring-1 ring-inset ring-issa-accent"
      )}
    >
      <th scope="row">
        <div className={tw("attendance-register__student flex min-w-0 items-center gap-3")}>
          {data.imgUrl ? (
            <img className={tw("attendance-register__portrait h-10 w-10 flex-none rounded-lg bg-issa-subtle object-cover ring-1 ring-issa-border")} src={data.imgUrl} alt="" />
          ) : (
            <span className={tw("grid h-10 w-10 flex-none place-items-center rounded-lg bg-issa-subtle text-supporting font-semibold text-issa-text ring-1 ring-issa-border")} aria-hidden="true">{String(data.name || "S").slice(0, 1).toUpperCase()}</span>
          )}
          <div className={tw("min-w-0")}><p className={tw("truncate font-semibold text-issa-text")}>{data.name}</p><p className={tw("mt-0.5 truncate text-metadata font-normal text-issa-muted")}>NIM {data.NIM || "-"}</p></div>
        </div>
      </th>
      <td className={tw("text-supporting text-issa-muted max-lg:col-start-1 max-sm:col-start-1")} data-label="Kelas">{data.Class?.name || "-"}</td>
      <td className={tw("max-lg:col-span-2 max-sm:col-span-1")} data-label="Status kehadiran">
        <fieldset className={tw("min-w-0")} disabled={attendanceBusy || workspace.isDemo}>
          <legend className={tw("sr-only")}>Status kehadiran {data.name}</legend>
          <div className={tw("grid min-w-0 grid-cols-4 gap-1.5 sm:max-w-[24rem]")}>
            {attendanceStatuses.map((status) => {
              const active = effectiveAttendance?.status === status.value;
              return (
                <button
                  key={status.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${status.value} — ${data.name}`}
                  onClick={() => handleAttendanceStatusChange(status.value)}
                  className={tw(
                    "min-h-[2.35rem] min-w-0 rounded-control border border-issa-border bg-transparent px-2 text-metadata font-semibold text-issa-muted transition-[background-color,border-color,color] duration-fast hover:border-issa-border-strong hover:bg-issa-subtle hover:text-issa-text focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
                    active && status.active
                  )}
                >{status.value}</button>
              );
            })}
          </div>
        </fieldset>
        <div className={tw("mt-2 min-h-5 text-metadata text-issa-muted")} aria-live="polite">
          {syncMessage || (workspace.isDemo ? "Tidak tersedia dalam mode demo." : "") || message || attendanceWorkspace.message}
        </div>
        {(message || attendanceWorkspace.message) && syncMessage && <p className={tw("mt-1 text-metadata text-issa-muted")} aria-live="polite">{message || attendanceWorkspace.message}</p>}
      </td>
      <td data-label="Record" className={tw("attendance-register__record-cell text-right max-lg:col-start-2 max-lg:row-start-1 max-sm:col-start-1 max-sm:row-auto max-sm:text-left")}>
        <ModalAttendances data={data.Attendances || []} id={`attendance-${data.id}`} studentName={data.name} />
      </td>
    </tr>
  );
}
