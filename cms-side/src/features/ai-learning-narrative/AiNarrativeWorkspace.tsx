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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DestructiveButton,
  PrimaryButton,
  SecondaryButton,
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

const bodyClasses = "grid min-w-0 gap-5 p-5 max-[639px]:px-4";
const bodySectionClasses = "min-w-0 border-t-2 border-[var(--border-strong)] pt-[0.9rem]";
const fieldClasses = "grid min-w-0 gap-[0.4rem] text-[0.875rem] font-[650] text-[var(--text)]";
const fieldControlClasses = "min-h-11 w-full min-w-0 max-w-full rounded-[var(--control-radius)] border border-[var(--border-strong)] bg-white px-3 py-2.5 text-[var(--text)] [font:inherit] focus-visible:border-[var(--accent)] focus-visible:shadow-[inset_0.24rem_0_0_#6bbfbc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const selectionLabelClasses = "flex min-h-11 min-w-0 items-center gap-[0.6rem] [overflow-wrap:anywhere] text-[0.86rem] text-[var(--text)]";
const actionRowClasses = "flex min-w-0 flex-wrap justify-end gap-[0.7rem] border-t border-[var(--border)] pt-4 max-[639px]:flex-col-reverse max-[639px]:[&>button]:w-full";
const citationButtonClasses = "rounded-[0.15rem_var(--control-radius)_0.15rem_0.15rem] border border-[var(--border-strong)] bg-white px-[0.55rem] py-[0.32rem] text-[0.72rem] font-[750] text-[#294d53] hover:bg-[#edf6f4] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";
const contextPanelClasses = "border border-[#d8c985] border-l-[0.3rem] border-l-[#9c7b2c] bg-[#fff8df] px-4 py-[0.85rem] text-[0.84rem] text-[var(--text)]";

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
  const statusToneClasses = {
    idle: "border-transparent text-[var(--muted)]",
    loading: "border-[#9ebfc5] border-l-[var(--accent)] bg-[#edf6f4] text-[var(--text)]",
    limited: "border-[#d8c985] border-l-[#9c7b2c] bg-[#fff8df] text-[#6e531d]",
    validation: "border-[#d7aaa4] border-l-[var(--danger)] bg-[#fff1ef] text-[#8b3f37]",
    error: "border-[#d7aaa4] border-l-[var(--danger)] bg-[#fff1ef] text-[#8b3f37]",
  };

  return (
    <Dialog open={open} onClose={closeWorkspace} initialFocus={panelRef}>
      <DialogBackdrop className="fixed inset-0 z-[80] bg-[rgba(11,23,27,0.68)]" />
      <div className="fixed inset-0 z-[81] grid place-items-center overflow-y-auto p-4 max-[639px]:[place-items:end_center] max-[639px]:p-0">
        <DialogPanel
          ref={panelRef}
          tabIndex={-1}
          className="max-h-[calc(100dvh-2rem)] w-[min(100%,58rem)] min-w-0 max-w-full overflow-x-hidden overflow-y-auto rounded-[var(--dialog-radius)] border-2 border-[var(--accent-strong)] bg-[var(--surface)] shadow-[var(--shadow-floating)] focus:outline-none motion-reduce:scroll-auto max-[639px]:max-h-[96dvh] max-[639px]:w-full max-[639px]:rounded-t-lg max-[639px]:rounded-b-none max-[639px]:border-x-0 max-[639px]:border-b-0"
        >
          <header className="flex min-w-0 items-start justify-between gap-4 border-b-2 border-[var(--accent-strong)] bg-[#173e52] px-5 py-[1.2rem] max-[639px]:px-4">
            <div className="min-w-0">
              <p className="m-0 text-[0.68rem] font-[850] uppercase tracking-[0.13em] text-[#f2d86e]">
                AI-assisted drafting instrument
              </p>
              <DialogTitle className="mt-1 text-[clamp(1.3rem,3vw,1.65rem)] font-[830] leading-[1.15] text-white">
                Susun draf perkembangan
              </DialogTitle>
              <p className="mt-2 max-w-[65ch] text-[0.8rem] leading-[1.55] text-[#c7e1eb]">
                Record sekolah menjadi dasar draf. Guru meninjau, mengedit, dan
                memutuskan apakah isi dipindahkan ke Feedback.
              </p>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 min-w-10 place-items-center rounded-[var(--control-radius)] border border-[#aac9ca] bg-transparent text-[1.55rem] leading-none text-white hover:border-[#f2d86e] hover:bg-[#204f62] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#f2d86e]"
              aria-label="Tutup workspace"
              onClick={closeWorkspace}
            >
              ×
            </button>
          </header>

          {!draft && (
            <div className={bodyClasses}>
              <section className={bodySectionClasses} aria-labelledby="ai-period-title">
                <h3 className="text-[0.9rem] font-extrabold text-[var(--text)]" id="ai-period-title">
                  Periode catatan
                </h3>
                <div className="mt-[0.7rem] grid grid-cols-2 gap-[0.8rem] max-[639px]:grid-cols-1">
                  <label className={fieldClasses}>
                    <span className="text-[0.9rem] font-extrabold text-[var(--text)]">
                      Tanggal awal
                    </span>
                    <input
                      className={fieldControlClasses}
                      type="date"
                      value={request.dateFrom}
                      onChange={(event) => setRequest({
                        ...request,
                        dateFrom: event.target.value,
                      })}
                    />
                  </label>
                  <label className={fieldClasses}>
                    <span className="text-[0.9rem] font-extrabold text-[var(--text)]">
                      Tanggal akhir
                    </span>
                    <input
                      className={fieldControlClasses}
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

              <section className={bodySectionClasses} aria-labelledby="ai-source-title">
                <h3 className="text-[0.9rem] font-extrabold text-[var(--text)]" id="ai-source-title">
                  Sumber catatan
                </h3>
                <p className="mt-[0.3rem] max-w-[66ch] text-[0.82rem] leading-[1.55] text-[var(--muted)]">
                  AI hanya menggunakan catatan yang dipilih dan tersedia pada periode ini.
                </p>
                <div className="mt-[0.8rem] grid grid-cols-2 border border-[var(--border-strong)] bg-white max-[639px]:grid-cols-1">
                  {ALL_SOURCE_TYPES.map((sourceType, sourceIndex) => {
                    const checked = request.sourceTypes.includes(sourceType);

                    return (
                      <label
                        className={`${selectionLabelClasses} border-b border-[var(--border)] py-[0.55rem] pr-3 ${
                          sourceIndex % 2 === 0
                            ? "border-r border-r-[var(--border)] max-[639px]:border-r-0"
                            : ""
                        } ${
                          checked
                            ? "border-l-[0.25rem] border-l-[var(--accent)] bg-[#e8f4f2] pl-2 font-[750]"
                            : "pl-3"
                        }`}
                        key={sourceType}
                      >
                        <input
                          className="h-4 w-4 min-w-4 [accent-color:var(--accent)]"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSource(sourceType)}
                        />
                        <span>{SOURCE_LABELS[sourceType]}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className={bodySectionClasses} aria-labelledby="ai-length-title">
                <h3 className="text-[0.9rem] font-extrabold text-[var(--text)]" id="ai-length-title">
                  Panjang draf
                </h3>
                <div className="mt-2 flex min-w-0 flex-wrap gap-x-6 gap-y-2">
                  {([
                    ["short", "Ringkas"],
                    ["medium", "Sedang"],
                  ] as const).map(([value, label]) => (
                    <label className={selectionLabelClasses} key={value}>
                      <input
                        className="h-4 w-4 min-w-4 [accent-color:var(--accent)]"
                        type="radio"
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
                className={`min-h-11 border border-l-[0.3rem] px-3 py-[0.65rem] text-[0.83rem] font-[650] leading-normal ${statusToneClasses[generationStatusType]}`}
                data-state={generationStatusType}
                aria-live="polite"
                aria-busy={mutation.isPending}
              >
                {generationStatus}
              </div>

              <div className={actionRowClasses}>
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
            <div className={bodyClasses}>
              <div
                className="grid gap-[0.3rem] border border-[#8eb7b4] border-l-[0.35rem] border-l-[var(--accent)] bg-[#e8f4f2] px-4 py-[0.85rem] text-[0.84rem] leading-[1.55] text-[var(--text)]"
                role="status"
              >
                <strong className="text-[0.76rem] uppercase tracking-[0.04em]">
                  AI-assisted draft · belum menjadi Feedback
                </strong>
                <span>
                  Guru tetap perlu meninjau setiap pernyataan dan sumber sebelum
                  menggunakannya.
                </span>
              </div>

              <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-[0.7rem] text-[0.76rem] text-[var(--muted)]">
                <span>
                  Dibuat {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(draft.generatedAt))}
                </span>
                <div
                  className="flex min-w-0 flex-wrap border border-[var(--border)] max-[639px]:grid max-[639px]:w-full"
                  aria-label="Ringkasan sumber"
                >
                  {Object.entries(draft.sourceSummary)
                    .filter(([, count]) => count > 0)
                    .map(([sourceType, count], summaryIndex) => (
                      <span
                        className={`px-[0.55rem] py-[0.35rem] text-[0.72rem] font-[750] text-[#294d53] ${
                          summaryIndex > 0
                            ? "border-l border-[var(--border)] max-[639px]:border-l-0 max-[639px]:border-t"
                            : ""
                        }`}
                        key={sourceType}
                      >
                        {SOURCE_LABELS[sourceType] || sourceType}: {count}
                      </span>
                    ))}
                </div>
              </div>

              <label className={fieldClasses}>
                <span className="text-[0.9rem] font-extrabold text-[var(--text)]">
                  Judul narasi
                </span>
                <input
                  className={fieldControlClasses}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setEdited(true);
                  }}
                />
              </label>

              <div className="grid min-w-0 gap-4">
                {sections.map((section, sectionIndex) => (
                  <section
                    className="min-w-0 border border-[var(--border-strong)] border-l-[0.35rem] border-l-[var(--accent)] bg-[#f7faf9] p-4"
                    key={section.localId}
                  >
                    <div className="mb-[0.7rem] flex min-w-0 items-start justify-between gap-4 max-[639px]:flex-col max-[639px]:gap-2">
                      <div className="flex min-w-0 items-baseline gap-[0.6rem]">
                        <span
                          className="text-[0.65rem] font-[850] tracking-[0.08em] text-[var(--muted)]"
                          aria-hidden="true"
                        >
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </span>
                        <h3 className="[overflow-wrap:anywhere] text-[0.9rem] font-extrabold text-[var(--text)]">
                          {SECTION_LABELS[section.sectionType] || section.sectionType}
                        </h3>
                      </div>
                      <button
                        type="button"
                        className="flex-none border-b border-[#d7aaa4] text-[0.75rem] font-[750] text-[#8b3f37] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                        onClick={() => {
                          setSections((current) => current.filter(
                            (item) => item.localId !== section.localId,
                          ));
                          setEdited(true);
                        }}
                      >
                        Hapus bagian
                      </button>
                    </div>
                    <label className={fieldClasses}>
                      <span className="sr-only">
                        {SECTION_LABELS[section.sectionType] || section.sectionType}
                      </span>
                      <textarea
                        className={`${fieldControlClasses} min-h-32 resize-y leading-[1.65] [overflow-wrap:anywhere]`}
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
                      <blockquote className="mt-3 grid min-w-0 gap-[0.45rem] border border-[#c8bed5] border-l-[0.3rem] border-l-[#72668c] bg-[#f5f1f8] px-[0.8rem] py-[0.7rem] text-[var(--text)]">
                        <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.06em] text-[var(--muted)]">
                          Kutipan siswa yang tercatat
                        </span>
                        <p className="m-0 leading-[1.65] [overflow-wrap:anywhere] [font-family:Georgia,'Times_New_Roman',serif]">
                          “{section.directQuote.text}”
                        </p>
                        <button
                          type="button"
                          className={`${citationButtonClasses} justify-self-start`}
                          onClick={() => setSelectedSourceRef(
                            section.directQuote?.sourceRef || null,
                          )}
                        >
                          Sumber {section.directQuote.sourceRef}
                        </button>
                      </blockquote>
                    )}
                    <div
                      className="mt-3 flex min-w-0 flex-wrap gap-[0.4rem]"
                      aria-label="Sumber bagian"
                    >
                      {section.sourceRefs.map((sourceRef) => (
                        <button
                          type="button"
                          key={sourceRef}
                          className={`${citationButtonClasses} ${
                            selectedSourceRef === sourceRef
                              ? "border-l-[0.3rem] border-[var(--accent-strong)] bg-[#dceceb] pl-[0.36rem]"
                              : ""
                          }`}
                          aria-expanded={selectedSourceRef === sourceRef}
                          onClick={() => setSelectedSourceRef(
                            selectedSourceRef === sourceRef ? null : sourceRef,
                          )}
                        >
                          [{sourceRef}]
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {selectedSource && (
                <aside
                  className="grid min-w-0 gap-1 rounded-[0.2rem_var(--surface-radius)_0.2rem_0.2rem] border-2 border-[var(--accent)] bg-[#edf6f4] px-4 py-[0.9rem] text-[0.84rem] leading-[1.55] text-[var(--text)]"
                  aria-label={`Detail sumber ${selectedSource.sourceRef}`}
                  tabIndex={0}
                >
                  <small className="text-[0.65rem] font-[850] uppercase tracking-[0.08em] text-[var(--accent)]">
                    Source record · {selectedSource.sourceRef}
                  </small>
                  <strong>{selectedSource.label}</strong>
                  <span className="text-[0.76rem] text-[var(--muted)]">
                    {SOURCE_LABELS[selectedSource.sourceType]} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(selectedSource.observedAt))}
                  </span>
                  <p className="mt-[0.35rem] max-w-[72ch] whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {selectedSource.preview}
                  </p>
                </aside>
              )}

              {draft.narrative.missingContext.length > 0 && (
                <section className={contextPanelClasses}>
                  <h3 className="text-[0.9rem] font-extrabold text-[var(--text)]">
                    Konteks yang belum tersedia
                  </h3>
                  <ul className="mt-[0.45rem] pl-5 text-[#655d47] [list-style:square]">
                    {draft.narrative.missingContext.map((item) => (
                      <li className="[overflow-wrap:anywhere]" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {draft.warnings.length > 0 && (
                <section className={contextPanelClasses}>
                  <h3 className="text-[0.9rem] font-extrabold text-[var(--text)]">
                    Catatan untuk ditinjau
                  </h3>
                  <ul className="mt-[0.45rem] pl-5 text-[#655d47] [list-style:square]">
                    {draft.warnings.map((warning) => (
                      <li className="[overflow-wrap:anywhere]" key={warning}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {confirmHandoff && (
                <div
                  className="border-2 border-[#b68a28] border-l-[0.4rem] bg-[#fff4c6] px-4 py-[0.9rem] text-[0.84rem] leading-[1.55] text-[var(--text)]"
                  role="alert"
                >
                  <p>
                    Feedback saat ini akan diganti di editor dengan draf ini.
                    Perubahan belum tersimpan sampai guru menekan Simpan Feedback.
                  </p>
                  <div className="mt-[0.8rem] flex flex-wrap justify-end gap-[0.6rem] max-[639px]:flex-col-reverse max-[639px]:[&>button]:w-full">
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
                className={`${actionRowClasses} sticky -bottom-5 z-[1] mx-[-1.25rem] mb-[-1.25rem] border-t-2 border-[var(--accent-strong)] bg-[#fffdf7] px-5 py-4 max-[639px]:-bottom-4 max-[639px]:mx-[-1rem] max-[639px]:mb-[-1.25rem] max-[639px]:p-4`}
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
