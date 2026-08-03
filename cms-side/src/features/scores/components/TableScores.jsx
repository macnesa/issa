import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateStudentScore } from "../../../store/action/ActionCreator";
import { formatRecordedDate, toIsoDateTime } from "../../../utils/recordDates";
import {
  InlineNotice,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "../../../shared/ui/ui";
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
    <tr className={tw("score-history-ledger__row border-t border-issa-border bg-issa-surface text-issa-text [transition:background-color_var(--issa-motion-fast)_ease] align-top hover:bg-issa-subtle [&>td]:p-3 motion-reduce:[transition:none]")}>
      <td className={tw("score-history-ledger__index text-issa-muted text-metadata font-bold")}>{String(recordIndex).padStart(2, "0")}</td>
      <td className={tw("score-history-ledger__subject text-issa-text font-semibold")}>
        {data.Lesson?.name || "Belum tersedia"}
      </td>
      <td className={tw("score-history-ledger__assessment text-issa-muted text-supporting")}>
        {data.Assignment?.name || "Belum tersedia"}
      </td>
      <td className={tw("score-history-ledger__threshold-note text-issa-text font-semibold")}>
        {data.Lesson?.KKM ?? "—"}
      </td>
      <td>
        {editing ? (
          <NumberField
            id={`score-value-${data.id}`}
            label="Nilai siswa"
            hideLabel
            className={tw("score-history-ledger__number-field [min-width:5.25rem]")}
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={setValue}
          />
        ) : (
          <span className={tw("score-history-ledger__score-value text-issa-text text-section-title font-bold leading-tight")}>{data.value ?? "—"}</span>
        )}
      </td>
      <td><StatusBadge status={status} /></td>
      {showPredikat && (
        <td className={tw("score-history-ledger__predicate text-issa-text font-semibold")}>
          {data.category || "—"}
        </td>
      )}
      <td className={tw("score-history-ledger__date text-issa-muted text-supporting")}>
        <div>{formatRecordedDate(data.recordedAt)}</div>
        {editing && (
          <DateTimeField
            id={`score-recorded-at-${data.id}`}
            label="Tanggal pencatatan"
            hideLabel
            value={recordedAt}
            onChange={setRecordedAt}
            optional
            className={tw("score-history-ledger__date-field [min-width:12rem] mt-2")}
          />
        )}
      </td>
      <td>
        <form onSubmit={handleScoreUpdateSubmit} className={tw("score-history-ledger__actions [min-width:7rem] [&>div]:flex [&>div]:gap-2")}>
          {editing ? (
            <div>
              <PrimaryButton
                type="submit"
                compact
                disabled={submitting}
              >
                {submitting ? "Menyimpan…" : "Simpan"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                compact
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                Batal
              </SecondaryButton>
            </div>
          ) : (
            <SecondaryButton
              type="button"
              compact
              onClick={handleScoreEditStart}
              disabled={isDemo}
            >
              Ubah
            </SecondaryButton>
          )}
          {isDemo && (
            <InlineNotice className={tw("score-history-ledger__notice mt-2")}>
              Tidak tersedia dalam mode demo.
            </InlineNotice>
          )}
          {message && (
            <InlineNotice
              className={tw("score-history-ledger__notice mt-2")}
              tone="danger"
            >
              {message}
            </InlineNotice>
          )}
        </form>
      </td>
    </tr>
  );
}
