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
import { PrimaryButton, SecondaryButton } from "../../shared/ui/ui";
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
import "./AiNarrativeWorkspace.css";

const ALL_SOURCE_TYPES: AiNarrativeSourceType[] = [
  "attendance",
  "score",
  "journal",
  "evidence",
  "feedback",
];

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

  return (
    <Dialog open={open} onClose={closeWorkspace} initialFocus={panelRef}>
      <DialogBackdrop className="ai-narrative__backdrop" />
      <div className="ai-narrative__container">
        <DialogPanel ref={panelRef} tabIndex={-1} className="ai-narrative__panel">
          <header className="ai-narrative__header">
            <div>
              <p className="ai-narrative__eyebrow">Learning Narrative Copilot</p>
              <DialogTitle className="ai-narrative__title">
                Susun draf perkembangan
              </DialogTitle>
            </div>
            <button
              type="button"
              className="ai-narrative__close"
              aria-label="Tutup workspace"
              onClick={closeWorkspace}
            >
              ×
            </button>
          </header>

          {!draft && (
            <div className="ai-narrative__body">
              <section aria-labelledby="ai-period-title">
                <h3 id="ai-period-title">Periode catatan</h3>
                <div className="ai-narrative__date-grid">
                  <label>
                    <span>Tanggal awal</span>
                    <input
                      type="date"
                      value={request.dateFrom}
                      onChange={(event) => setRequest({
                        ...request,
                        dateFrom: event.target.value,
                      })}
                    />
                  </label>
                  <label>
                    <span>Tanggal akhir</span>
                    <input
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

              <section aria-labelledby="ai-source-title">
                <h3 id="ai-source-title">Sumber catatan</h3>
                <p className="ai-narrative__hint">
                  AI hanya menggunakan catatan yang dipilih dan tersedia pada periode ini.
                </p>
                <div className="ai-narrative__check-grid">
                  {ALL_SOURCE_TYPES.map((sourceType) => (
                    <label key={sourceType}>
                      <input
                        type="checkbox"
                        checked={request.sourceTypes.includes(sourceType)}
                        onChange={() => toggleSource(sourceType)}
                      />
                      <span>{SOURCE_LABELS[sourceType]}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section aria-labelledby="ai-length-title">
                <h3 id="ai-length-title">Panjang draf</h3>
                <div className="ai-narrative__radio-row">
                  {([
                    ["short", "Ringkas"],
                    ["medium", "Sedang"],
                  ] as const).map(([value, label]) => (
                    <label key={value}>
                      <input
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

              <div className="ai-narrative__status" aria-live="polite">
                {validationMessage}
                {mutation.isPending && "Menyusun draf berdasarkan catatan siswa…"}
                {mutation.isError && mutation.error.message}
              </div>

              <div className="ai-narrative__actions">
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
            <div className="ai-narrative__body">
              <div className="ai-narrative__notice" role="status">
                Draf disusun dengan bantuan AI. Guru tetap perlu meninjau setiap
                pernyataan sebelum menggunakannya.
              </div>

              <div className="ai-narrative__meta">
                <span>
                  Dibuat {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(draft.generatedAt))}
                </span>
                <div className="ai-narrative__summary" aria-label="Ringkasan sumber">
                  {Object.entries(draft.sourceSummary)
                    .filter(([, count]) => count > 0)
                    .map(([sourceType, count]) => (
                      <span key={sourceType}>
                        {SOURCE_LABELS[sourceType] || sourceType}: {count}
                      </span>
                    ))}
                </div>
              </div>

              <label className="ai-narrative__field">
                <span>Judul narasi</span>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setEdited(true);
                  }}
                />
              </label>

              <div className="ai-narrative__sections">
                {sections.map((section) => (
                  <section className="ai-narrative__section" key={section.localId}>
                    <div className="ai-narrative__section-heading">
                      <h3>{SECTION_LABELS[section.sectionType] || section.sectionType}</h3>
                      <button
                        type="button"
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
                    <label className="ai-narrative__field">
                      <span className="sr-only">
                        {SECTION_LABELS[section.sectionType] || section.sectionType}
                      </span>
                      <textarea
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
                      <blockquote className="ai-narrative__quote">
                        <span>Kutipan siswa yang tercatat</span>
                        <p>“{section.directQuote.text}”</p>
                        <button
                          type="button"
                          onClick={() => setSelectedSourceRef(
                            section.directQuote?.sourceRef || null,
                          )}
                        >
                          {section.directQuote.sourceRef}
                        </button>
                      </blockquote>
                    )}
                    <div className="ai-narrative__chips" aria-label="Sumber bagian">
                      {section.sourceRefs.map((sourceRef) => (
                        <button
                          type="button"
                          key={sourceRef}
                          aria-expanded={selectedSourceRef === sourceRef}
                          onClick={() => setSelectedSourceRef(
                            selectedSourceRef === sourceRef ? null : sourceRef,
                          )}
                        >
                          {sourceRef}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {selectedSource && (
                <aside
                  className="ai-narrative__source-detail"
                  aria-label={`Detail sumber ${selectedSource.sourceRef}`}
                  tabIndex={0}
                >
                  <strong>{selectedSource.label}</strong>
                  <span>
                    {SOURCE_LABELS[selectedSource.sourceType]} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(selectedSource.observedAt))}
                  </span>
                  <p>{selectedSource.preview}</p>
                </aside>
              )}

              {draft.narrative.missingContext.length > 0 && (
                <section className="ai-narrative__context">
                  <h3>Konteks yang belum tersedia</h3>
                  <ul>
                    {draft.narrative.missingContext.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {draft.warnings.length > 0 && (
                <section className="ai-narrative__warnings">
                  <h3>Catatan untuk ditinjau</h3>
                  <ul>
                    {draft.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}

              {confirmHandoff && (
                <div className="ai-narrative__confirmation" role="alert">
                  <p>Feedback saat ini akan diganti dengan draf yang telah ditinjau.</p>
                  <div>
                    <SecondaryButton
                      type="button"
                      onClick={() => setConfirmHandoff(false)}
                    >
                      Batalkan
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={completeHandoff}>
                      Ganti Feedback
                    </PrimaryButton>
                  </div>
                </div>
              )}

              <div className="ai-narrative__actions ai-narrative__actions--review">
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
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    if (!edited || window.confirm("Buang draf yang sudah diedit?")) {
                      resetDraft();
                    }
                  }}
                >
                  Buang draf
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  disabled={!buildFeedbackText(title, sections)}
                  onClick={requestHandoff}
                >
                  Gunakan pada Feedback
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
