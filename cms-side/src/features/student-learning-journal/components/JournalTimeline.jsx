import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/ui";
import { evidenceCategoryLabels } from "../../student-evidence/studentEvidence.constants";
import {
  formatJournalDate,
  journalEntryTypes,
  journalVoiceCaptureTypes,
} from "../studentLearningJournal.constants";
import "./JournalTimeline.css";

function retractErrorMessage(error) {
  if (error?.status === 401 || error?.status === 403) {
    return "Catatan tidak dapat dicabut. Catatan mungkin dibuat oleh guru lain.";
  }
  return error?.message || "Catatan perjalanan belajar gagal dicabut.";
}

export default function JournalTimeline({
  entries,
  onEdit,
  onRetract,
  readOnly = false,
}) {
  const [entryToRetract, setEntryToRetract] = useState(null);
  const [retracting, setRetracting] = useState(false);
  const [retractError, setRetractError] = useState("");

  function closeDialog() {
    if (retracting) return;
    setEntryToRetract(null);
    setRetractError("");
  }

  async function confirmRetraction() {
    if (!entryToRetract || retracting) return;
    setRetracting(true);
    setRetractError("");
    try {
      await onRetract(entryToRetract);
      setEntryToRetract(null);
    } catch (error) {
      setRetractError(retractErrorMessage(error));
    } finally {
      setRetracting(false);
    }
  }

  return (
    <div className="journal-timeline">
      <div className="journal-timeline__heading">
        <p>Shared record</p>
        <h3>Riwayat perjalanan belajar</h3>
        <span>Urutan catatan mengikuti record terbaru dari server.</span>
      </div>

      <ol className="journal-timeline__list">
        {entries.map((entry, index) => {
          const type = journalEntryTypes[entry.type];
          const capture = journalVoiceCaptureTypes[entry.voiceCaptureType];
          const isReflection = entry.type === "student_reflection";
          const evidenceRetracted =
            entry.evidence?.availability === "retracted";

          return (
            <li
              key={entry.id}
              className={`journal-timeline__entry journal-timeline__entry--${type?.tone || "default"}`}
            >
              <div className="journal-timeline__rail" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <article>
                <header className="journal-timeline__entry-header">
                  <div className="journal-timeline__labels">
                    <span>{type?.label || entry.type}</span>
                    {capture && <span>· {capture.label}</span>}
                    {entry.wasEdited && (
                      <span className="journal-timeline__edited">Diedit</span>
                    )}
                  </div>
                  <time dateTime={entry.observedAt}>
                    Diamati {formatJournalDate(entry.observedAt)}
                  </time>
                </header>

                {isReflection ? (
                  <blockquote className="journal-timeline__content">
                    {entry.content}
                  </blockquote>
                ) : (
                  <p className="journal-timeline__content">{entry.content}</p>
                )}

                <p className="journal-timeline__teacher">
                  Dicatat oleh {entry.teacher?.name || "Guru"}
                </p>

                {entry.evidence && (
                  <div
                    className={`journal-timeline__evidence ${
                      evidenceRetracted
                        ? "journal-timeline__evidence--retracted"
                        : ""
                    }`}
                  >
                    {!evidenceRetracted && entry.evidence.file?.url && (
                      <img
                        src={entry.evidence.file.url}
                        alt={`Evidence terkait: ${entry.evidence.title}`}
                      />
                    )}
                    <div>
                      <span>
                        {evidenceRetracted
                          ? "Evidence terkait telah dicabut."
                          : "Evidence terkait"}
                      </span>
                      <strong>{entry.evidence.title}</strong>
                      <small>
                        {evidenceCategoryLabels[entry.evidence.category]
                          || entry.evidence.category
                          || "Kategori tidak tersedia"}
                        {" · "}
                        {formatJournalDate(entry.evidence.observedAt)}
                      </small>
                    </div>
                  </div>
                )}

                {!readOnly && <div className="journal-timeline__actions">
                  <button type="button" onClick={() => onEdit(entry)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="journal-timeline__retract"
                    onClick={() => {
                      setRetractError("");
                      setEntryToRetract(entry);
                    }}
                  >
                    Cabut catatan
                  </button>
                </div>}
              </article>
            </li>
          );
        })}
      </ol>

      <Dialog open={Boolean(entryToRetract)} onClose={closeDialog}>
        <DialogBackdrop className="journal-retract-dialog__backdrop" />
        <div className="journal-retract-dialog__container">
          <DialogPanel className="journal-retract-dialog__panel">
            <DialogTitle className="journal-retract-dialog__title">
              Cabut catatan ini?
            </DialogTitle>
            <p className="journal-retract-dialog__copy">
              Catatan tidak lagi terlihat oleh orang tua, tetapi tetap disimpan
              sebagai record internal.
            </p>
            {retractError && (
              <p
                className="journal-retract-dialog__error"
                role="alert"
                aria-live="assertive"
              >
                {retractError}
              </p>
            )}
            <div className="journal-retract-dialog__actions">
              <SecondaryButton
                type="button"
                onClick={closeDialog}
                disabled={retracting}
              >
                Batal
              </SecondaryButton>
              <PrimaryButton
                type="button"
                className="journal-retract-dialog__confirm"
                onClick={confirmRetraction}
                disabled={retracting}
              >
                {retracting ? "Mencabut..." : "Cabut catatan"}
              </PrimaryButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
