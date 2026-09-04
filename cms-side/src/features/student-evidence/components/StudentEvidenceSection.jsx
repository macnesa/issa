import { tw } from "../../../shared/ui/tw";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DestructiveButton,
  EmptyState,
  ErrorState,
  LedgerShell,
  LoadingState,
  SecondaryButton,
} from "../../../shared/ui/ui";
import {
  RESOURCE_PROVENANCE,
  RESOURCE_STATUS,
  resourceError,
  resourceFromData,
  resourceLoading,
} from "../../../shared/data/resourceTruth";
import { formatRecordedDate } from "../../../utils/recordDates";
import {
  createStudentEvidence,
  fetchStudentEvidences,
  retractStudentEvidence,
  updateStudentEvidenceMetadata,
} from "../studentEvidenceApi";
import {
  evidenceCategoryLabels,
  formatEvidenceFileSize,
} from "../studentEvidence.constants";
import EvidenceUploadForm from "./EvidenceUploadForm";
import EvidenceMetadataDialog from "./EvidenceMetadataDialog";
import EvidenceRetractionDialog from "./EvidenceRetractionDialog";
import EvidenceViewerDialog from "./EvidenceViewerDialog";

const ignoreEvidenceLoaded = () => {};

export default function StudentEvidenceSection({
  demoReadOnly = false,
  studentId,
  onEvidenceChanged = () => {},
  onEvidenceLoaded = ignoreEvidenceLoaded,
}) {
  const [resource, setResource] = useState(() => resourceLoading({ data: [], scope: "evidence" }));
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [retractingEvidence, setRetractingEvidence] = useState(null);
  const [viewingEvidence, setViewingEvidence] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const requestSequence = useRef(0);
  const actionTriggerRef = useRef(null);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    const requestId = ++requestSequence.current;
    setResource((current) => resourceLoading({
      data: current.data || [],
      provenance: current.provenance,
      scope: "evidence",
    }));
    try {
      const evidenceList = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== requestSequence.current) return;
      const nextResource = resourceFromData(evidenceList, {
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "evidence",
      });
      setResource(nextResource);
      await Promise.resolve(onEvidenceLoaded(evidenceList, nextResource));
      setViewingEvidence((current) => (
        current && !evidenceList.some((evidence) => evidence.id === current.id)
          ? null
          : current
      ));
    } catch (error) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource(resourceError(error?.message || "Bukti perkembangan belum dapat dimuat.", {
        data: [],
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "evidence",
      }));
    }
  }, [onEvidenceLoaded, studentId]);

  useEffect(() => {
    const requestController = new AbortController();
    loadEvidences({ signal: requestController.signal });
    return () => requestController.abort();
  }, [loadEvidences]);

  async function handleUpload(evidenceFormData) {
    if (demoReadOnly) return;
    await createStudentEvidence(studentId, evidenceFormData);
    await Promise.all([
      loadEvidences(),
      Promise.resolve(onEvidenceChanged()),
    ]);
  }

  function rememberTrigger(event) {
    actionTriggerRef.current = event.currentTarget;
  }

  function restoreTriggerFocus() {
    window.requestAnimationFrame(() => actionTriggerRef.current?.focus());
  }

  function closeMetadataDialog() {
    setEditingEvidence(null);
    restoreTriggerFocus();
  }

  function closeRetractionDialog() {
    setRetractingEvidence(null);
    restoreTriggerFocus();
  }

  function closeViewer() {
    setViewingEvidence(null);
    restoreTriggerFocus();
  }

  async function handleMetadataSubmit(evidence, metadata) {
    if (demoReadOnly) return;
    try {
      return await updateStudentEvidenceMetadata(
        studentId,
        evidence.id,
        metadata
      );
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        await loadEvidences();
      }
      throw error;
    }
  }

  async function handleRetractionSubmit(evidence, reason) {
    if (demoReadOnly) return;
    try {
      return await retractStudentEvidence(studentId, evidence.id, reason);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        await loadEvidences();
      }
      throw error;
    }
  }

  async function refreshAfterMutation(kind, evidenceId) {
    if (
      kind === "retracted" &&
      viewingEvidence?.id === evidenceId
    ) {
      setViewingEvidence(null);
    }
    setStatusMessage(
      kind === "retracted"
        ? "Bukti berhasil dicabut."
        : "Metadata bukti berhasil diperbarui."
    );
    await Promise.all([
      loadEvidences(),
      Promise.resolve(onEvidenceChanged()),
    ]);
  }

  return (
    <>
      <LedgerShell
        className={tw("student-evidence-record min-w-0")}
        eyebrow="Bukti siswa"
        title="Bukti perkembangan"
        description="Foto dan keterangan yang membantu guru memahami perkembangan siswa."
      >

        <EvidenceUploadForm
          demoReadOnly={demoReadOnly}
          onUpload={handleUpload}
        />

        <div className={tw("student-evidence-history border-t border-issa-border")}>
          <div className={tw("student-evidence-history__heading px-0 pb-3 pt-5 bg-transparent [&_p]:text-issa-muted [&_p]:text-metadata [&_p]:font-medium [&_p]:tracking-normal [&_h3]:mt-1 [&_h3]:text-issa-text [&_h3]:text-section-title [&_h3]:font-semibold")}>
            <p>Riwayat bukti</p>
            <h3>Daftar bukti perkembangan</h3>
          </div>
          <p
            className={tw("student-evidence-history__status min-h-6 py-2 text-issa-muted text-metadata")}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>

          {resource.status === RESOURCE_STATUS.LOADING && (
            <LoadingState label="Memuat bukti siswa..." />
          )}
          {resource.status === RESOURCE_STATUS.ERROR && (
            <ErrorState message={resource.error} onRetry={() => loadEvidences()} />
          )}
          {resource.status === RESOURCE_STATUS.EMPTY && (
            <EmptyState title="Belum ada bukti perkembangan untuk siswa ini." />
          )}
          {resource.status === RESOURCE_STATUS.KNOWN && resource.data.length > 0 && (
            <ol className={tw("student-evidence-history__list m-0 p-0 list-none")}>
              {resource.data.map((evidence, index) => (
                <li className={tw("grid [grid-template-columns:5rem_minmax(0,_1fr)] gap-4 py-4 [&+&]:border-t [&+&]:border-issa-border max-sm:grid-cols-1")} key={evidence.id}>
                  <span className={tw("student-evidence-history__index hidden")} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className={tw("student-evidence-history__thumbnail [width:5rem] [height:5rem] overflow-hidden rounded-control p-0 bg-issa-subtle ring-1 ring-issa-border focus-visible:outline-emphasis focus-visible:outline-issa-focus focus-visible:outline-offset-1 max-sm:w-full max-sm:[height:12rem] [&_img]:w-full [&_img]:h-full [&_img]:object-cover")}
                    onClick={(event) => {
                      rememberTrigger(event);
                      setViewingEvidence(evidence);
                    }}
                    aria-label={`Buka bukti ${evidence.title}`}
                  >
                    {evidence.file?.url ? (
                      <img src={evidence.file.url} alt="" />
                    ) : (
                      <span className={tw("student-evidence-history__thumbnail-placeholder grid h-full place-items-center p-2 text-issa-muted text-metadata")}>
                        Preview tidak tersedia
                      </span>
                    )}
                  </button>
                  <div className={tw("student-evidence-history__copy min-w-0 [&>p]:block [&>p]:mt-2 [&>p]:text-issa-muted [&>p]:text-supporting [&>p]:leading-normal [&>small]:block [&>small]:mt-2 [&>small]:text-issa-muted [&>small]:text-supporting [&>small]:leading-normal")}>
                    <div className={tw("flex flex-wrap justify-between gap-2 text-issa-muted text-metadata")}>
                      <span>{evidenceCategoryLabels[evidence.category] || evidence.category}</span>
                      <time dateTime={evidence.observedAt}>
                        {formatRecordedDate(evidence.observedAt, "Tanggal tidak tersedia")}
                      </time>
                    </div>
                    <h4 className={tw("mt-1 text-issa-text text-body font-semibold")}>{evidence.title}</h4>
                    {evidence.description && <p>{evidence.description}</p>}
                    <small>
                      Guru: {evidence.teacher?.name || "-"} · {(evidence.file?.format || "").toUpperCase()} · {formatEvidenceFileSize(evidence.file?.size)}
                    </small>
                    <div className={tw("student-evidence-history__actions flex flex-wrap items-center gap-2 mt-3 max-sm:[&>.issa-button]:w-full")}>
                      <SecondaryButton
                        compact
                        type="button"
                        disabled={demoReadOnly}
                        onClick={(event) => {
                          if (demoReadOnly) return;
                          rememberTrigger(event);
                          setEditingEvidence(evidence);
                        }}
                      >
                        Edit detail
                      </SecondaryButton>
                      <DestructiveButton
                        compact
                        type="button"
                        disabled={demoReadOnly}
                        onClick={(event) => {
                          if (demoReadOnly) return;
                          rememberTrigger(event);
                          setRetractingEvidence(evidence);
                        }}
                      >
                        Cabut bukti
                      </DestructiveButton>
                      {demoReadOnly && (
                        <span className={tw("student-evidence-history__demo text-issa-muted text-metadata")}>
                          Tidak tersedia dalam mode demo.
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </LedgerShell>

      <EvidenceMetadataDialog
        evidence={editingEvidence}
        onClose={closeMetadataDialog}
        onSubmit={handleMetadataSubmit}
        onSuccess={(evidenceId) =>
          refreshAfterMutation("corrected", evidenceId)}
      />
      <EvidenceRetractionDialog
        evidence={retractingEvidence}
        onClose={closeRetractionDialog}
        onSubmit={handleRetractionSubmit}
        onSuccess={(evidenceId) =>
          refreshAfterMutation("retracted", evidenceId)}
      />
      <EvidenceViewerDialog
        demoReadOnly={demoReadOnly}
        evidence={viewingEvidence}
        onClose={closeViewer}
        onRequestRetraction={(evidence) => {
          setViewingEvidence(null);
          setRetractingEvidence(evidence);
        }}
      />
    </>
  );
}
