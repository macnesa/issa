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
import "./ai-narrative-workspace.css";

const ALL_SOURCE_TYPES: AiNarrativeSourceType[] = [
  "attendance",
  "score",
  "journal",
  "evidence",
  "feedback",
];

const bodyClasses = "ai-workspace__body";
const bodySectionClasses = "ai-workspace__section";
const fieldClasses = "ai-workspace__field";
const fieldControlClasses = "issa-native-control";
const selectionLabelClasses = "ai-workspace__selection";
const actionRowClasses = "ai-workspace__actions";
const contextPanelClasses = "ai-workspace__context";

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
      <DialogBackdrop className="issa-dialog-backdrop" />
      <div className="issa-dialog-container ai-workspace__container">
        <DialogPanel
          ref={panelRef}
          tabIndex={-1}
          className="issa-dialog-panel ai-workspace"
        >
          <header className="ai-workspace__header">
            <div className="ai-workspace__header-copy">
              <p className="ai-workspace__eyebrow">
                AI-assisted drafting instrument
              </p>
              <DialogTitle className="ai-workspace__title">
                Susun draf perkembangan
              </DialogTitle>
              <p className="ai-workspace__intro">
                Record sekolah menjadi dasar draf. Guru meninjau, mengedit, dan
                memutuskan apakah isi dipindahkan ke Feedback.
              </p>
            </div>
            <TertiaryButton
              type="button"
              compact
              className="ai-workspace__close"
              aria-label="Tutup workspace"
              onClick={closeWorkspace}
            >
              ×
            </TertiaryButton>
          </header>

          {!draft && (
            <div className={bodyClasses}>
              <section className={bodySectionClasses} aria-labelledby="ai-period-title">
                <h3 className="ai-workspace__section-title" id="ai-period-title">
                  Periode catatan
                </h3>
                <div className="ai-workspace__period-grid">
                  <label className={fieldClasses}>
                    <span>
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
                    <span>
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
                <h3 className="ai-workspace__section-title" id="ai-source-title">
                  Sumber catatan
                </h3>
                <p className="ai-workspace__section-copy">
                  AI hanya menggunakan catatan yang dipilih dan tersedia pada periode ini.
                </p>
                <div className="ai-workspace__source-grid">
                  {ALL_SOURCE_TYPES.map((sourceType, sourceIndex) => {
                    const checked = request.sourceTypes.includes(sourceType);

                    return (
                      <label
                        className={`${selectionLabelClasses}${sourceIndex % 2 === 0 ? " is-even" : ""}${checked ? " is-selected" : ""}`}
                        key={sourceType}
                      >
                        <input
                          className="ai-workspace__choice-input"
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
                <h3 className="ai-workspace__section-title" id="ai-length-title">
                  Panjang draf
                </h3>
                <div className="ai-workspace__length-options">
                  {([
                    ["short", "Ringkas"],
                    ["medium", "Sedang"],
                  ] as const).map(([value, label]) => (
                    <label className={selectionLabelClasses} key={value}>
                      <input
                        className="ai-workspace__choice-input"
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
                className="ai-workspace__generation-status"
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
                className="ai-workspace__draft-notice"
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

              <div className="ai-workspace__draft-metadata">
                <span>
                  Dibuat {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(draft.generatedAt))}
                </span>
                <div
                  className="ai-workspace__source-summary"
                  aria-label="Ringkasan sumber"
                >
                  {Object.entries(draft.sourceSummary)
                    .filter(([, count]) => count > 0)
                    .map(([sourceType, count], summaryIndex) => (
                      <span
                        className={summaryIndex > 0 ? "has-divider" : ""}
                        key={sourceType}
                      >
                        {SOURCE_LABELS[sourceType] || sourceType}: {count}
                      </span>
                    ))}
                </div>
              </div>

              <label className={fieldClasses}>
                <span>
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

              <div className="ai-workspace__draft-sections">
                {sections.map((section, sectionIndex) => (
                  <section
                    className="ai-workspace__draft-section"
                    key={section.localId}
                  >
                    <div className="ai-workspace__draft-section-header">
                      <div className="ai-workspace__draft-section-heading">
                        <span
                          className="ai-workspace__section-number"
                          aria-hidden="true"
                        >
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </span>
                        <h3>
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
                    <label className={fieldClasses}>
                      <span className="sr-only">
                        {SECTION_LABELS[section.sectionType] || section.sectionType}
                      </span>
                      <textarea
                        className={`${fieldControlClasses} ai-workspace__textarea`}
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
                      <blockquote className="ai-workspace__quote">
                        <span>
                          Kutipan siswa yang tercatat
                        </span>
                        <p>
                          “{section.directQuote.text}”
                        </p>
                        <SecondaryButton
                          type="button"
                          compact
                          className="ai-workspace__citation"
                          onClick={() => setSelectedSourceRef(
                            section.directQuote?.sourceRef || null,
                          )}
                        >
                          Sumber {section.directQuote.sourceRef}
                        </SecondaryButton>
                      </blockquote>
                    )}
                    <div
                      className="ai-workspace__citations"
                      aria-label="Sumber bagian"
                    >
                      {section.sourceRefs.map((sourceRef) => (
                        <SecondaryButton
                          type="button"
                          compact
                          key={sourceRef}
                          className={`ai-workspace__citation${selectedSourceRef === sourceRef ? " is-selected" : ""}`}
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
                  className="ai-workspace__source-detail"
                  aria-label={`Detail sumber ${selectedSource.sourceRef}`}
                  tabIndex={0}
                >
                  <small>
                    Source record · {selectedSource.sourceRef}
                  </small>
                  <strong>{selectedSource.label}</strong>
                  <span>
                    {SOURCE_LABELS[selectedSource.sourceType]} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(selectedSource.observedAt))}
                  </span>
                  <p>
                    {selectedSource.preview}
                  </p>
                </aside>
              )}

              {draft.narrative.missingContext.length > 0 && (
                <section className={contextPanelClasses}>
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
                <section className={contextPanelClasses}>
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
                  className="ai-workspace__handoff-warning"
                  role="alert"
                >
                  <p>
                    Feedback saat ini akan diganti di editor dengan draf ini.
                    Perubahan belum tersimpan sampai guru menekan Simpan Feedback.
                  </p>
                  <div className="ai-workspace__handoff-actions">
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
                className={`${actionRowClasses} ai-workspace__sticky-actions`}
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
