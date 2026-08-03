import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  DestructiveButton,
  SecondaryButton,
} from "../../../shared/ui/ui";
import { evidenceCategoryLabels } from "../../student-evidence/studentEvidence.constants";
import {
  formatJournalDate,
  journalEntryTypes,
  journalVoiceCaptureTypes,
} from "../studentLearningJournal.constants";

function retractErrorMessage(error) {
  if (error?.code === "publicDemoReadOnly") {
    return "Perubahan data tidak tersedia dalam mode demo.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Catatan tidak dapat dicabut. Catatan mungkin dibuat oleh guru lain.";
  }
  return error?.message || "Catatan perjalanan belajar gagal dicabut.";
}

export default function JournalTimeline({
  entries,
  onEdit,
  onRetract,
  demoReadOnly = false,
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
    if (demoReadOnly) return;
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
    <div className={tw("journal-timeline border-t border-issa-border")}>
      <div className={tw("journal-timeline__heading p-4 bg-issa-subtle [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-bold [&_p]:tracking-metadata [&_p]:uppercase [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-bold [&>span]:block [&>span]:mt-1 [&>span]:text-issa-muted [&>span]:text-supporting")}>
        <p>Shared record</p>
        <h3>Riwayat perjalanan belajar</h3>
        <span>Urutan catatan mengikuti record terbaru dari server.</span>
      </div>

      <ol className={tw("journal-timeline__list m-0 p-0 list-none")}>
        {entries.map((entry, index) => {
          const type = journalEntryTypes[entry.type];
          const capture = journalVoiceCaptureTypes[entry.voiceCaptureType];
          const isReflection = entry.type === "student_reflection";
          const evidenceRetracted =
            entry.evidence?.availability === "retracted";

          return (
            <li
              key={entry.id}
              className={tw(`journal-timeline__entry grid [grid-template-columns:2rem_minmax(0,_1fr)] gap-3 p-4 [&+&]:border-t [&+&]:border-issa-border max-sm:grid-cols-1 journal-timeline__entry--${type?.tone || "default"}`)}
            >
              <div className={tw("journal-timeline__rail text-issa-muted text-metadata font-bold max-sm:hidden")} aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <article>
                <header className={tw("journal-timeline__entry-header flex min-w-0 items-baseline justify-between gap-3 max-sm:items-start max-sm:flex-col")}>
                  <div className={tw("journal-timeline__labels text-issa-muted text-metadata font-bold tracking-metadata uppercase")}>
                    <span>{type?.label || entry.type}</span>
                    {capture && <span>· {capture.label}</span>}
                    {entry.wasEdited && (
                      <span className={tw("journal-timeline__edited text-issa-warning")}>Diedit</span>
                    )}
                  </div>
                  <time className={tw("flex-none text-issa-muted text-metadata")} dateTime={entry.observedAt}>
                    Diamati {formatJournalDate(entry.observedAt)}
                  </time>
                </header>

                {isReflection ? (
                  <blockquote className={tw("journal-timeline__content mt-3 text-issa-text [font-family:inherit] text-body [font-style:normal] leading-normal whitespace-pre-wrap")}>
                    {entry.content}
                  </blockquote>
                ) : (
                  <p className={tw("journal-timeline__content mt-3 text-issa-text [font-family:inherit] text-body [font-style:normal] leading-normal whitespace-pre-wrap")}>{entry.content}</p>
                )}

                <p className={tw("journal-timeline__teacher mt-2 text-issa-muted text-metadata")}>
                  Dicatat oleh {entry.teacher?.name || "Guru"}
                </p>

                {entry.evidence && (
                  <div
                    className={tw(`journal-timeline__evidence flex min-w-0 items-center gap-3 mt-3 border border-issa-border rounded-surface p-3 bg-issa-subtle [&_img]:w-12 [&_img]:h-12 [&_img]:flex-none [&_img]:rounded-control [&_img]:object-cover [&>div]:grid [&>div]:min-w-0 [&>div]:gap-1 [&_span]:text-issa-muted [&_span]:text-metadata [&_small]:text-issa-muted [&_small]:text-metadata [&_strong]:text-issa-text [&_strong]:text-supporting ${
                      evidenceRetracted
                        ? "journal-timeline__evidence--retracted border-issa-warning"
                        : ""
                    }`)}
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

                {(!readOnly || demoReadOnly) && (
                <div className={tw("journal-timeline__actions flex flex-wrap items-center gap-2 mt-3")}>
                  <SecondaryButton
                    compact
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      if (!readOnly) onEdit(entry);
                    }}
                  >
                    Edit
                  </SecondaryButton>
                  <DestructiveButton
                    compact
                    type="button"
                    className={tw("journal-timeline__retract")}
                    disabled={readOnly}
                    onClick={() => {
                      setRetractError("");
                      setEntryToRetract(entry);
                    }}
                  >
                    Cabut catatan
                  </DestructiveButton>
                  {demoReadOnly && (
                    <span className={tw("journal-timeline__demo text-issa-muted text-metadata")}>
                      Tidak tersedia dalam mode demo.
                    </span>
                  )}
                </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      <Dialog open={Boolean(entryToRetract)} onClose={closeDialog}>
        <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
        <div className={tw("issa-dialog-container fixed z-dialog inset-0 grid place-items-center overflow-y-auto p-4")}>
          <DialogPanel className={tw("issa-dialog-panel [width:min(32rem,_100%)] overflow-hidden border border-issa-border-strong rounded-dialog bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both]")}>
            <div className={tw("issa-dialog-header border-b border-issa-border p-4")}>
              <DialogTitle className={tw("issa-dialog-title text-issa-text text-section-title font-bold leading-tight")}>Cabut catatan ini?</DialogTitle>
            </div>
            <div className={tw("issa-dialog-body p-4 text-supporting leading-normal text-issa-muted")}>
            <p>
              Catatan tidak lagi terlihat oleh orang tua, tetapi tetap disimpan
              sebagai record internal.
            </p>
            {retractError && (
              <p
                className={tw("issa-dialog-error min-h-6 [margin:var(--issa-space-3)_var(--issa-space-4)] text-issa-danger text-supporting font-semibold")}
                role="alert"
                aria-live="assertive"
              >
                {retractError}
              </p>
            )}
            </div>
            <div className={tw("issa-dialog-footer flex flex-wrap justify-end gap-2 border-t border-issa-border p-4")}>
              <SecondaryButton
                type="button"
                onClick={closeDialog}
                disabled={retracting}
              >
                Batal
              </SecondaryButton>
              <DestructiveButton
                type="button"
                onClick={confirmRetraction}
                disabled={retracting}
              >
                {retracting ? "Mencabut..." : "Cabut catatan"}
              </DestructiveButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
