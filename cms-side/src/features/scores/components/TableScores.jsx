import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateStudentScore } from "../../../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../../../utils/recordDates";
import { PrimaryButton, SecondaryButton, StatusBadge } from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";
import NumberField from "../../../shared/ui/form-controls/NumberField";
import { useOfflineWorkspace } from "../../../offline-workspace/OfflineWorkspaceProvider";

export default function TableScores({
  data,
  student,
  recordIndex,
  showPredikat = false,
}) {
  const dispatch = useDispatch();
  const { isDemo } = useOfflineWorkspace();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScoreEditStart = () => {
    if (isDemo) {
      setMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }
    setValue(String(data.value ?? ""));
    setRecordedAt("");
    setMessage("");
    setEditing(true);
  };

  const handleScoreUpdateSubmit = (event) => {
    event.preventDefault();
    if (isDemo) {
      setMessage("Perubahan data tidak tersedia dalam mode demo.");
      return;
    }
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
      .catch((error) => setMessage(error.message || "Nilai gagal diperbarui."))
      .finally(() => setSubmitting(false));
  };

  const status = data.status === true ? "Lulus" : data.status === false ? "Belum lulus" : undefined;

  return (
    <tr className="score-history-ledger__row border-t border-[var(--border)] align-top text-[var(--text)]">
      <td className="score-history-ledger__index px-3 py-3">{String(recordIndex).padStart(2, "0")}</td>
      <td className="score-history-ledger__subject px-3 py-3">
        {data.Lesson?.name || "Belum tersedia"}
      </td>
      <td className="score-history-ledger__assessment px-3 py-3">
        {data.Assignment?.name || "Belum tersedia"}
      </td>
      <td className="score-history-ledger__threshold-note px-3 py-3">
        {data.Lesson?.KKM ?? "—"}
      </td>
      <td className="px-3 py-3">
        {editing ? (
          <NumberField
            id={`score-value-${data.id}`}
            label="Nilai siswa"
            hideLabel
            className="score-history-ledger__number-field issa-control-tone--score"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={setValue}
          />
        ) : (
          <span className="score-history-ledger__score-value">{data.value ?? "—"}</span>
        )}
      </td>
      <td className="px-3 py-3"><StatusBadge status={status} /></td>
      {showPredikat && (
        <td className="score-history-ledger__predicate px-3 py-3">
          {data.category || "—"}
        </td>
      )}
      <td className="score-history-ledger__date px-3 py-3">
        <div>{formatRecordedDate(data.recordedAt)}</div>
        {editing && (
          <DateTimeField
            id={`score-recorded-at-${data.id}`}
            label="Tanggal pencatatan"
            hideLabel
            value={recordedAt}
            onChange={setRecordedAt}
            optional
            tone="score"
            className="score-history-ledger__date-field"
          />
        )}
      </td>
      <td className="px-3 py-3">
        <form onSubmit={handleScoreUpdateSubmit} className="min-w-28">
          {editing ? (
            <div className="flex gap-2">
              <PrimaryButton
                type="submit"
                className="min-h-8 px-3 py-1 text-xs"
                disabled={submitting}
              >
                {submitting ? "Menyimpan…" : "Simpan"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                className="min-h-8 px-3 py-1 text-xs"
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                Batal
              </SecondaryButton>
            </div>
          ) : (
            <SecondaryButton
              type="button"
              className="score-history-ledger__action min-h-8 px-3 py-1 text-xs"
              onClick={handleScoreEditStart}
              disabled={isDemo}
            >
              Ubah
            </SecondaryButton>
          )}
          {isDemo && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Tidak tersedia dalam mode demo.
            </p>
          )}
          {message && <p role="status" className="mt-2 text-xs text-rose-700">{message}</p>}
        </form>
      </td>
    </tr>
  );
}
