import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import { TableCell, TableRow } from "flowbite-react/components/Table";
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
import { parseScoreInput } from "../scoreValue";

export default function TableScores({
  data,
  student,
  recordIndex,
  showPredikat = false,
  mobile = false,
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
    const nextValue = parseScoreInput(value);
    if (nextValue === null) {
      setMessage("Nilai harus berupa angka bulat 0–100 dan tidak boleh kosong.");
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
  const actionControls = (
    <form onSubmit={handleScoreUpdateSubmit} className={tw("score-history-ledger__actions grid min-w-0 gap-2")}>
      {editing ? (
        <div className={tw("flex flex-wrap gap-2")}>
          <PrimaryButton type="submit" compact disabled={submitting}>
            {submitting ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
          <SecondaryButton type="button" compact onClick={() => setEditing(false)} disabled={submitting}>
            Batal
          </SecondaryButton>
        </div>
      ) : (
        <SecondaryButton type="button" compact onClick={handleScoreEditStart} disabled={isDemo}>
          Ubah
        </SecondaryButton>
      )}
      {isDemo && <InlineNotice>Tidak tersedia dalam mode demo.</InlineNotice>}
      {message && <InlineNotice tone="danger">{message}</InlineNotice>}
    </form>
  );

  if (mobile) {
    return (
      <article className={tw("score-history-mobile min-w-0 border-b border-issa-border py-4 last:border-b-0")}>
        <div className={tw("flex min-w-0 items-start justify-between gap-4")}>
          <div className={tw("min-w-0 flex-1")}>
            <p className={tw("text-metadata font-semibold text-issa-muted")}>#{String(recordIndex).padStart(2, "0")}</p>
            <h4 className={tw("mt-1 truncate text-body font-semibold text-issa-text")}>{data.Lesson?.name || "Mata pelajaran belum tersedia"}</h4>
            <p className={tw("mt-1 text-supporting leading-relaxed text-issa-muted")}>{data.Assignment?.name || "Penilaian belum tersedia"}</p>
          </div>
          <div className={tw("flex flex-none flex-col items-end gap-2")}>
            <span className={tw("text-[1.65rem] font-semibold tabular-nums leading-none text-issa-text")}>{data.value ?? "—"}</span>
            <StatusBadge status={status} />
          </div>
        </div>

        <dl className={tw("mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-issa-border py-3 text-metadata")}>
          <div><dt className={tw("text-issa-muted")}>KKM</dt><dd className={tw("mt-0.5 font-semibold text-issa-text")}>{data.Lesson?.KKM ?? "—"}</dd></div>
          <div><dt className={tw("text-issa-muted")}>Tanggal</dt><dd className={tw("mt-0.5 font-semibold text-issa-text")}>{formatRecordedDate(data.recordedAt)}</dd></div>
          {showPredikat && <div className={tw("col-span-2")}><dt className={tw("text-issa-muted")}>Predikat</dt><dd className={tw("mt-0.5 font-semibold text-issa-text")}>{data.category || "—"}</dd></div>}
        </dl>

        {editing && (
          <div className={tw("mt-4 grid gap-3 sm:grid-cols-2")}>
            <NumberField
              id={`score-mobile-value-${data.id}`}
              label="Nilai siswa"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={setValue}
            />
            <DateTimeField
              id={`score-mobile-recorded-at-${data.id}`}
              label="Tanggal pencatatan"
              value={recordedAt}
              onChange={setRecordedAt}
              optional
            />
          </div>
        )}
        <div className={tw("mt-4")}>{actionControls}</div>
      </article>
    );
  }

  return (
    <TableRow className={tw("score-history-ledger__row")}>
      <TableCell className={tw("score-history-ledger__index text-issa-muted text-metadata font-bold")}>{String(recordIndex).padStart(2, "0")}</TableCell>
      <TableCell className={tw("score-history-ledger__subject text-issa-text font-semibold")}>{data.Lesson?.name || "Belum tersedia"}</TableCell>
      <TableCell className={tw("score-history-ledger__assessment text-issa-muted text-supporting")}>{data.Assignment?.name || "Belum tersedia"}</TableCell>
      <TableCell className={tw("score-history-ledger__threshold-note text-issa-text font-semibold")}>{data.Lesson?.KKM ?? "—"}</TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell><StatusBadge status={status} /></TableCell>
      {showPredikat && <TableCell className={tw("score-history-ledger__predicate text-issa-text font-semibold")}>{data.category || "—"}</TableCell>}
      <TableCell className={tw("score-history-ledger__date text-issa-muted text-supporting")}>
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
      </TableCell>
      <TableCell><div className={tw("[min-width:7rem]")}>{actionControls}</div></TableCell>
    </TableRow>
  );
}
