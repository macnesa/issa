import { tw } from "../../shared/ui/tw";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import { Checkbox } from "flowbite-react/components/Checkbox";
import { Radio } from "flowbite-react/components/Radio";
import { Textarea } from "flowbite-react/components/Textarea";
import { TextInput } from "flowbite-react/components/TextInput";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DestructiveButton,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
} from "../../shared/ui/ui";
import { generateAiNarrative } from "./aiNarrativeApi";
import {
  buildFeedbackText,
  SECTION_LABELS,
  SOURCE_LABELS,
} from "./aiNarrativeText";
import type {
  AiNarrativeData,
  AiNarrativeRequest,
  EditableNarrativeSection,
} from "./aiNarrativeTypes";
import type { AiNarrativeSourceType } from "./aiNarrativeSchema";

const ALL_SOURCE_TYPES: AiNarrativeSourceType[] = [
  "attendance",
  "score",
  "journal",
  "evidence",
  "feedback",
];

const bodyClasses = "ai-workspace__body grid min-w-0 gap-6 p-6 max-[640px]:px-4";
const bodySectionClasses = "ai-workspace__section min-w-0 border-b border-issa-border pb-5";
const fieldClasses = "ai-workspace__field grid min-w-0 gap-1 [&>span]:text-label [&>span]:font-semibold [&>span]:text-issa-text";
const fieldControlClasses = "issa-native-control min-h-control w-full min-w-0 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-2 text-body text-issa-text outline-none placeholder:text-issa-muted hover:border-issa-accent focus:border-issa-accent focus:ring-2 focus:ring-issa-focus disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:text-issa-text-disabled";
const selectionLabelClasses = "ai-workspace__selection flex min-h-control cursor-pointer items-center gap-2 px-3 py-2 text-body text-issa-text";
const actionRowClasses = "ai-workspace__actions flex flex-wrap justify-end gap-2 max-[640px]:flex-col-reverse max-[640px]:[&>button]:w-full";
const contextPanelClasses = "ai-workspace__context min-w-0 rounded-surface border border-issa-border bg-issa-subtle p-4 [&_h3]:text-label [&_h3]:font-bold [&_h3]:leading-tight [&_h3]:text-issa-text [&_ul]:mt-2 [&_ul]:list-square [&_ul]:pl-6 [&_ul]:text-supporting [&_ul]:text-issa-muted [&_li]:[overflow-wrap:anywhere]";

function isoToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBefore(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() - days);
  return result.toISOString().slice(0, 10);
}

function validateRequest(request: AiNarrativeRequest): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.dateFrom)
    || !/^\d{4}-\d{2}-\d{2}$/.test(request.dateTo)) {
    return "Gunakan format tanggal yang valid.";
  }
  const start = new Date(`${request.dateFrom}T00:00:00Z`);
  const end = new Date(`${request.dateTo}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Gunakan format tanggal yang valid.";
  }
  if (start > end) return "Tanggal awal tidak boleh setelah tanggal akhir.";
  const daySpan = (end.getTime() - start.getTime()) / 86_400_000;
  if (daySpan > 90) return "Periode maksimal adalah 90 hari.";
  if (!request.sourceTypes.length) return "Pilih minimal satu sumber catatan.";
  return "";
}

type WorkspaceProps = {
  open: boolean;
  studentId: string;
  existingFeedback: string;
  onClose: () => void;
  onUseFeedback: (value: string) => void;
};

function Workspace({
  open,
  studentId,
  existingFeedback,
  onClose,
  onUseFeedback,
}: WorkspaceProps) {
  const today = useMemo(isoToday, []);
  const [request, setRequest] = useState<AiNarrativeRequest>({
    dateFrom: daysBefore(today, 30),
    dateTo: today,
    sourceTypes: ALL_SOURCE_TYPES,
    length: "short",
  });
  const [validationMessage, setValidationMessage] = useState("");
  const [draft, setDraft] = useState<AiNarrativeData | null>(null);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<EditableNarrativeSection[]>([]);
  const [edited, setEdited] = useState(false);
  const [selectedSourceRef, setSelectedSourceRef] = useState<string | null>(null);
  const [confirmHandoff, setConfirmHandoff] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const mutation = useMutation({
    mutationFn: (input: AiNarrativeRequest) => generateAiNarrative(studentId, input),
    retry: false,
    onSuccess: (data) => {
      setDraft(data);
      setTitle(data.narrative.title);
      setSections(data.narrative.sections.map((section, index) => ({
        ...section,
        localId: `${section.sectionType}-${index}`,
      })));
      setEdited(false);
      setSelectedSourceRef(null);
    },
  });

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [draft]);

  const resetDraft = () => {
    mutation.reset();
    setDraft(null);
    setTitle("");
    setSections([]);
    setEdited(false);
    setSelectedSourceRef(null);
    setConfirmHandoff(false);
    setValidationMessage("");
  };

  const closeWorkspace = () => {
    if (edited && !window.confirm("Buang perubahan pada draf ini?")) return;
    resetDraft();
    onClose();
  };

  const submitRequest = () => {
    const message = validateRequest(request);
    setValidationMessage(message);
    if (message) return;
    mutation.mutate(request);
  };

  const toggleSource = (sourceType: AiNarrativeSourceType) => {
    setRequest((current) => ({
      ...current,
      sourceTypes: current.sourceTypes.includes(sourceType)
        ? current.sourceTypes.filter((item) => item !== sourceType)
        : [...current.sourceTypes, sourceType],
    }));
  };

  const completeHandoff = () => {
    const value = buildFeedbackText(title, sections);
    if (!value) return;
    onUseFeedback(value);
    resetDraft();
    onClose();
  };

  const requestHandoff = () => {
    if (existingFeedback.trim()) {
      setConfirmHandoff(true);
      return;
    }
    completeHandoff();
  };

  const sourceByRef = new Map(
    (draft?.sources || []).map((source) => [source.sourceRef, source]),
  );
  const selectedSource = selectedSourceRef
    ? sourceByRef.get(selectedSourceRef)
    : undefined;
  const generationStatus = validationMessage
    || (mutation.isPending
      ? "Menyusun draf berdasarkan catatan siswa…"
      : mutation.isError
        ? mutation.error.message
        : "");
  const generationStatusType = validationMessage
    ? "validation"
    : mutation.isPending
      ? "loading"
      : mutation.isError
        && mutation.error.message.includes("cukup catatan")
        ? "limited"
        : mutation.isError
          ? "error"
          : "idle";
  return (
    <Dialog open={open} onClose={closeWorkspace} initialFocus={panelRef}>
      <DialogBackdrop className={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]")} />
      <div className={tw("issa-dialog-container ai-workspace__container fixed inset-0 z-dialog grid place-items-center overflow-y-auto p-4 max-[640px]:place-items-end_center max-[640px]:p-0")}>
        <DialogPanel
          ref={panelRef}
          tabIndex={-1}
          className={tw("issa-dialog-panel ai-workspace w-[min(58rem,100%)] max-h-[calc(100dvh_-_var(--issa-space-8))] overflow-x-hidden overflow-y-auto rounded-dialog border-emphasis border-issa-border-strong bg-issa-surface shadow-dialog outline-none [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both] max-[640px]:max-h-[96dvh] max-[640px]:w-full max-[640px]:rounded-b-none max-[640px]:border-x-0 max-[640px]:border-b-0")}
        >
          <header className={tw("ai-workspace__header flex min-w-0 items-start justify-between gap-4 border-b-emphasis border-issa-border-strong bg-issa-text px-6 py-4 max-[640px]:px-4")}>
            <div className={tw("ai-workspace__header-copy min-w-0")}>
              <p className={tw("ai-workspace__eyebrow text-issa-focus text-eyebrow font-bold tracking-product uppercase")}>
                AI-assisted drafting instrument
              </p>
              <DialogTitle className={tw("ai-workspace__title mt-1 text-issa-inverse text-page-title font-bold leading-tight")}>
                Susun draf perkembangan
              </DialogTitle>
              <p className={tw("ai-workspace__intro [max-width:65ch] mt-2 text-issa-inverse-muted text-supporting leading-normal")}>
                Record sekolah menjadi dasar draf. Guru meninjau, mengedit, dan
                memutuskan apakah isi dipindahkan ke Feedback.
              </p>
            </div>
            <TertiaryButton
              type="button"
              compact
              className={tw("ai-workspace__close min-w-control border-issa-border-strong p-1 text-2xl leading-none text-issa-inverse enabled:hover:bg-[color-mix(in_srgb,var(--issa-surface)_10%,transparent)] enabled:hover:text-issa-inverse")}
              aria-label="Tutup workspace"
              onClick={closeWorkspace}
            >
              ×
            </TertiaryButton>
          </header>

          {!draft && (
            <div className={tw(bodyClasses)}>
              <section className={tw(bodySectionClasses)} aria-labelledby="ai-period-title">
                <h3 className={tw("ai-workspace__section-title text-label font-bold leading-tight text-issa-text")} id="ai-period-title">
                  Periode catatan
                </h3>
                <div className={tw("ai-workspace__period-grid mt-3 grid grid-cols-2 gap-3 max-[640px]:grid-cols-1")}>
                  <label className={tw(fieldClasses)}>
                    <span>
                      Tanggal awal
                    </span>
                    <input
                      className={tw(fieldControlClasses)}
                      type="date"
                      value={request.dateFrom}
                      onChange={(event) => setRequest({
                        ...request,
                        dateFrom: event.target.value,
                      })}
                    />
                  </label>
                  <label className={tw(fieldClasses)}>
                    <span>
                      Tanggal akhir
                    </span>
                    <input
                      className={tw(fieldControlClasses)}
                      type="date"
                      value={request.dateTo}
                      onChange={(event) => setRequest({
                        ...request,
                        dateTo: event.target.value,
                      })}
                    />
                  </label>
                </div>
              </section>

              <section className={tw(bodySectionClasses)} aria-labelledby="ai-source-title">
                <h3 className={tw("ai-workspace__section-title text-label font-bold leading-tight text-issa-text")} id="ai-source-title">
                  Sumber catatan
                </h3>
                <p className={tw("ai-workspace__section-copy [max-width:66ch] mt-1 text-issa-muted text-supporting leading-normal")}>
                  AI hanya menggunakan catatan yang dipilih dan tersedia pada periode ini.
                </p>
                <div className={tw("ai-workspace__source-grid mt-3 grid grid-cols-2 border border-issa-border-strong bg-issa-surface max-[640px]:grid-cols-1")}>
                  {ALL_SOURCE_TYPES.map((sourceType, sourceIndex) => {
                    const checked = request.sourceTypes.includes(sourceType);

                    return (
                      <label
                        className={tw(
                          selectionLabelClasses,
                          sourceIndex % 2 === 0 && "is-even border-r border-issa-border max-[640px]:border-r-0",
                          checked && "is-selected border-l-emphasis border-issa-accent bg-issa-subtle font-semibold"
                        )}
                        key={sourceType}
                      >
                        <Checkbox
                          className={tw("ai-workspace__choice-input")}
                          color="issa"
                          checked={checked}
                          onChange={() => toggleSource(sourceType)}
                        />
                        <span>{SOURCE_LABELS[sourceType]}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className={tw(bodySectionClasses)} aria-labelledby="ai-length-title">
                <h3 className={tw("ai-workspace__section-title text-label font-bold leading-tight text-issa-text")} id="ai-length-title">
                  Panjang draf
                </h3>
                <div className={tw("ai-workspace__length-options flex min-w-0 flex-wrap [gap:var(--issa-space-2)_var(--issa-space-6)] mt-2")}>
                  {([
                    ["short", "Ringkas"],
                    ["medium", "Sedang"],
                  ] as const).map(([value, label]) => (
                    <label className={tw(selectionLabelClasses)} key={value}>
                      <Radio
                        className={tw("ai-workspace__choice-input")}
                        color="issa"
                        name="ai-narrative-length"
                        checked={request.length === value}
                        onChange={() => setRequest({ ...request, length: value })}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <div
                className={tw("ai-workspace__generation-status min-h-control border border-transparent border-l-accent px-3 py-2 text-supporting font-semibold text-issa-muted data-[state=loading]:border-issa-border-strong data-[state=loading]:border-l-issa-accent data-[state=loading]:bg-issa-subtle data-[state=loading]:text-issa-text data-[state=limited]:border-[color-mix(in_srgb,var(--issa-warning)_45%,var(--issa-border))] data-[state=limited]:border-l-issa-warning data-[state=limited]:bg-[color-mix(in_srgb,var(--issa-warning)_8%,var(--issa-surface))] data-[state=limited]:text-issa-warning data-[state=validation]:border-[color-mix(in_srgb,var(--issa-danger)_35%,var(--issa-border))] data-[state=validation]:border-l-issa-danger data-[state=validation]:bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))] data-[state=validation]:text-issa-danger data-[state=error]:border-[color-mix(in_srgb,var(--issa-danger)_35%,var(--issa-border))] data-[state=error]:border-l-issa-danger data-[state=error]:bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))] data-[state=error]:text-issa-danger")}
                data-state={generationStatusType}
                aria-live="polite"
                aria-busy={mutation.isPending}
              >
                {generationStatus}
              </div>

              <div className={tw(actionRowClasses)}>
                <SecondaryButton type="button" onClick={closeWorkspace}>
                  Batal
                </SecondaryButton>
                {mutation.isError && (
                  <SecondaryButton
                    type="button"
                    onClick={submitRequest}
                  >
                    Coba lagi
                  </SecondaryButton>
                )}
                <PrimaryButton
                  type="button"
                  disabled={mutation.isPending}
                  onClick={submitRequest}
                >
                  {mutation.isPending ? "Menyusun draf…" : "Susun draf"}
                </PrimaryButton>
              </div>
            </div>
          )}

          {draft && (
            <div className={tw(bodyClasses)}>
              <div
                className={tw("ai-workspace__draft-notice grid gap-1 border border-issa-border-strong border-l-accent border-l-issa-accent bg-issa-subtle px-4 py-3 text-supporting leading-normal text-issa-text [&_strong]:text-metadata [&_strong]:uppercase [&_strong]:tracking-metadata")}
                role="status"
              >
                <strong>
                  AI-assisted draft · belum menjadi Feedback
                </strong>
                <span>
                  Guru tetap perlu meninjau setiap pernyataan dan sumber sebelum
                  menggunakannya.
                </span>
              </div>

              <div className={tw("ai-workspace__draft-metadata flex min-w-0 flex-wrap items-start justify-between [gap:var(--issa-space-2)_var(--issa-space-4)] text-issa-muted text-metadata")}>
                <span>
                  Dibuat {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(draft.generatedAt))}
                </span>
                <div
                  className={tw("ai-workspace__source-summary flex min-w-0 flex-wrap border border-issa-border max-[640px]:grid max-[640px]:w-full")}
                  aria-label="Ringkasan sumber"
                >
                  {Object.entries(draft.sourceSummary)
                    .filter(([, count]) => count > 0)
                    .map(([sourceType, count], summaryIndex) => (
                      <span
                        className={tw("px-2 py-1 text-metadata font-semibold text-issa-text", summaryIndex > 0 && "has-divider border-l border-issa-border max-[640px]:border-l-0 max-[640px]:border-t")}
                        key={sourceType}
                      >
                        {SOURCE_LABELS[sourceType] || sourceType}: {count}
                      </span>
                    ))}
                </div>
              </div>

              <label className={tw(fieldClasses)}>
                <span>
                  Judul narasi
                </span>
                <TextInput
                  className={tw("ai-workspace__title-input")}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setEdited(true);
                  }}
                />
              </label>

              <div className={tw("ai-workspace__draft-sections grid min-w-0 gap-4")}>
                {sections.map((section, sectionIndex) => (
                  <section
                    className={tw("ai-workspace__draft-section min-w-0 border border-issa-border-strong [border-left:0.25rem_solid_var(--issa-accent)] bg-issa-page p-4")}
                    key={section.localId}
                  >
                    <div className={tw("ai-workspace__draft-section-header mb-3 flex min-w-0 items-start justify-between gap-4 max-[640px]:flex-col max-[640px]:gap-2")}>
                      <div className={tw("ai-workspace__draft-section-heading flex min-w-0 items-baseline gap-2")}>
                        <span
                          className={tw("ai-workspace__section-number text-issa-muted text-metadata font-bold tracking-metadata")}
                          aria-hidden="true"
                        >
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </span>
                        <h3 className={tw("[overflow-wrap:anywhere] text-label font-bold leading-tight text-issa-text")}>
                          {SECTION_LABELS[section.sectionType] || section.sectionType}
                        </h3>
                      </div>
                      <DestructiveButton
                        type="button"
                        compact
                        onClick={() => {
                          setSections((current) => current.filter(
                            (item) => item.localId !== section.localId,
                          ));
                          setEdited(true);
                        }}
                      >
                        Hapus bagian
                      </DestructiveButton>
                    </div>
                    <label className={tw(fieldClasses)}>
                      <span className={tw("sr-only")}>
                        {SECTION_LABELS[section.sectionType] || section.sectionType}
                      </span>
                      <Textarea
                        className={tw("ai-workspace__textarea [min-height:8rem] resize-y [overflow-wrap:anywhere] leading-normal")}
                        rows={5}
                        value={section.text}
                        onChange={(event) => {
                          setSections((current) => current.map((item) => (
                            item.localId === section.localId
                              ? { ...item, text: event.target.value }
                              : item
                          )));
                          setEdited(true);
                        }}
                      />
                    </label>
                    {section.directQuote && (
                      <blockquote className={tw("ai-workspace__quote mt-3 grid min-w-0 gap-2 border border-issa-border border-l-accent border-l-issa-info bg-issa-surface p-3 text-issa-text")}>
                        <span className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-muted")}>
                          Kutipan siswa yang tercatat
                        </span>
                        <p className={tw("[overflow-wrap:anywhere] leading-normal")}>
                          “{section.directQuote.text}”
                        </p>
                        <SecondaryButton
                          type="button"
                          compact
                          className={tw("ai-workspace__citation justify-self-start")}
                          onClick={() => setSelectedSourceRef(
                            section.directQuote?.sourceRef || null,
                          )}
                        >
                          Sumber {section.directQuote.sourceRef}
                        </SecondaryButton>
                      </blockquote>
                    )}
                    <div
                      className={tw("ai-workspace__citations flex min-w-0 flex-wrap gap-1 mt-3")}
                      aria-label="Sumber bagian"
                    >
                      {section.sourceRefs.map((sourceRef) => (
                        <SecondaryButton
                          type="button"
                          compact
                          key={sourceRef}
                          className={tw(
                            "ai-workspace__citation justify-self-start",
                            selectedSourceRef === sourceRef && "is-selected border-l-accent border-issa-accent bg-issa-subtle"
                          )}
                          aria-expanded={selectedSourceRef === sourceRef}
                          onClick={() => setSelectedSourceRef(
                            selectedSourceRef === sourceRef ? null : sourceRef,
                          )}
                        >
                          [{sourceRef}]
                        </SecondaryButton>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {selectedSource && (
                <aside
                  className={tw("ai-workspace__source-detail grid min-w-0 gap-1 [border:var(--issa-border-width-emphasis)_solid_var(--issa-accent)] rounded-surface bg-issa-subtle py-3 px-4 text-issa-text text-supporting leading-normal")}
                  aria-label={`Detail sumber ${selectedSource.sourceRef}`}
                  tabIndex={0}
                >
                  <small className={tw("text-metadata font-bold uppercase tracking-metadata text-issa-accent")}>
                    Source record · {selectedSource.sourceRef}
                  </small>
                  <strong>{selectedSource.label}</strong>
                  <span className={tw("text-metadata text-issa-muted")}>
                    {SOURCE_LABELS[selectedSource.sourceType]} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(selectedSource.observedAt))}
                  </span>
                  <p className={tw("mt-1 max-w-[72ch] whitespace-pre-wrap [overflow-wrap:anywhere]")}>
                    {selectedSource.preview}
                  </p>
                </aside>
              )}

              {draft.narrative.missingContext.length > 0 && (
                <section className={tw(contextPanelClasses)}>
                  <h3>
                    Konteks yang belum tersedia
                  </h3>
                  <ul>
                    {draft.narrative.missingContext.map((item) => (
                      <li key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {draft.warnings.length > 0 && (
                <section className={tw(contextPanelClasses)}>
                  <h3>
                    Catatan untuk ditinjau
                  </h3>
                  <ul>
                    {draft.warnings.map((warning) => (
                      <li key={warning}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {confirmHandoff && (
                <div
                  className={tw("ai-workspace__handoff-warning grid gap-1 border border-[color-mix(in_srgb,var(--issa-warning)_55%,var(--issa-border))] border-l-accent border-l-issa-warning bg-[color-mix(in_srgb,var(--issa-warning)_10%,var(--issa-surface))] px-4 py-3 text-supporting leading-normal text-issa-text")}
                  role="alert"
                >
                  <p>
                    Feedback saat ini akan diganti di editor dengan draf ini.
                    Perubahan belum tersimpan sampai guru menekan Simpan Feedback.
                  </p>
                  <div className={tw("ai-workspace__handoff-actions mt-3 flex flex-wrap justify-end gap-2 max-[640px]:flex-col-reverse max-[640px]:[&>button]:w-full")}>
                    <SecondaryButton
                      type="button"
                      onClick={() => setConfirmHandoff(false)}
                    >
                      Batalkan
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={completeHandoff}>
                      Gunakan draf di editor
                    </PrimaryButton>
                  </div>
                </div>
              )}

              <div
                className={tw(actionRowClasses, "ai-workspace__sticky-actions sticky z-[1] -bottom-6 -mx-6 -mb-6 border-t-emphasis border-issa-border-strong bg-issa-surface px-6 py-4 max-[640px]:-bottom-4 max-[640px]:-mx-4 max-[640px]:-mb-6 max-[640px]:p-4")}
              >
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    mutation.reset();
                    setDraft(null);
                    setSelectedSourceRef(null);
                    setConfirmHandoff(false);
                  }}
                >
                  Susun ulang
                </SecondaryButton>
                <DestructiveButton
                  type="button"
                  onClick={() => {
                    if (!edited || window.confirm("Buang draf yang sudah diedit?")) {
                      resetDraft();
                    }
                  }}
                >
                  Buang draf
                </DestructiveButton>
                <PrimaryButton
                  type="button"
                  disabled={!buildFeedbackText(title, sections)}
                  onClick={requestHandoff}
                >
                  Tinjau lalu pindahkan ke Feedback
                </PrimaryButton>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default function AiNarrativeWorkspace(props: WorkspaceProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Workspace {...props} />
    </QueryClientProvider>
  );
}
