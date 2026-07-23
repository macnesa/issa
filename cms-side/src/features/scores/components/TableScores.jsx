import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateStudentScore } from "../../../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../../../utils/recordDates";
import { PrimaryButton, SecondaryButton, StatusBadge } from "../../../shared/ui/ui";

const inputClassName = "w-20 rounded-md border border-[var(--border-strong)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]";

export default function TableScores({ data, student }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScoreEditStart = () => {
    setValue(String(data.value ?? ""));
    setRecordedAt("");
    setMessage("");
    setEditing(true);
  };

  const handleScoreUpdateSubmit = (event) => {
    event.preventDefault();
    const nextValue = Number(value);
    if (!Number.isInteger(nextValue) || nextValue < 0 || nextValue > 100) {
      setMessage("Nilai harus berupa angka bulat 0–100.");
      return;
    }
    const normalizedRecordedAt = toIsoDateTime(recordedAt);
    if (recordedAt && !normalizedRecordedAt) {
      setMessage("Tanggal pencatatan tidak valid.");
      return;
    }
    const payload = { ScoreId: data.id, value: nextValue };
    if (normalizedRecordedAt) payload.recordedAt = normalizedRecordedAt;

    setSubmitting(true);
    setMessage("");
    dispatch(updateStudentScore(student.id, payload))
      .then(() => { setEditing(false); setRecordedAt(""); })
      .catch((error) => setMessage(error.message || "Score gagal diperbarui."))
      .finally(() => setSubmitting(false));
  };

  const status = data.status === true ? "Lulus" : data.status === false ? "Belum lulus" : undefined;

  return (
    <tr className="border-t border-[var(--border)] align-top text-[var(--text)]">
      <td className="px-4 py-4 font-medium">{data.Assignment?.name || "Assessment belum tersedia"}</td>
      <td className="px-4 py-4">{data.Lesson?.name || "—"}</td>
      <td className="px-4 py-4">{data.Lesson?.KKM ?? "—"}</td>
      <td className="px-4 py-4">{editing ? <input aria-label="Nilai score" className={inputClassName} min="0" max="100" step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /> : data.value ?? "—"}</td>
      <td className="px-4 py-4">{data.category || "—"}</td>
      <td className="px-4 py-4"><StatusBadge status={status} /></td>
      <td className="px-4 py-4"><div>{formatRecordedDate(data.recordedAt)}</div>{editing && <input aria-label="Tanggal pencatatan score" type="datetime-local" value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} className="mt-2 rounded-md border border-[var(--border-strong)] px-2 py-1.5 text-xs outline-none focus:border-[var(--accent)]" />}</td>
      <td className="px-4 py-4"><form onSubmit={handleScoreUpdateSubmit} className="min-w-28">{editing ? <div className="flex gap-2"><PrimaryButton type="submit" className="min-h-8 px-3 py-1 text-xs" disabled={submitting}>{submitting ? "..." : "Simpan"}</PrimaryButton><SecondaryButton type="button" className="min-h-8 px-3 py-1 text-xs" onClick={() => setEditing(false)} disabled={submitting}>Batal</SecondaryButton></div> : <SecondaryButton type="button" className="min-h-8 px-3 py-1 text-xs" onClick={handleScoreEditStart}>Ubah</SecondaryButton>}{message && <p role="status" className="mt-2 text-xs text-rose-700">{message}</p>}</form></td>
    </tr>
  );
}
