import { useCallback, useEffect, useRef, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Surface,
} from "../../../shared/ui/ui";
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
import "./StudentEvidenceSection.css";

export default function StudentEvidenceSection({
  demoReadOnly = false,
  studentId,
  onEvidenceChanged = () => {},
}) {
  const [resource, setResource] = useState({
    status: "loading",
    data: [],
    error: "",
  });
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [retractingEvidence, setRetractingEvidence] = useState(null);
  const [viewingEvidence, setViewingEvidence] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const requestSequence = useRef(0);
  const actionTriggerRef = useRef(null);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    const requestId = ++requestSequence.current;
    setResource((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const evidenceList = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({ status: "success", data: evidenceList, error: "" });
      setViewingEvidence((current) => (
        current && !evidenceList.some((evidence) => evidence.id === current.id)
          ? null
          : current
      ));
    } catch (error) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({
        status: "error",
        data: [],
        error: error?.message || "Bukti perkembangan belum dapat dimuat.",
      });
    }
  }, [studentId]);

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
        ? "Evidence berhasil dicabut."
        : "Metadata evidence berhasil diperbarui."
    );
    await Promise.all([
      loadEvidences(),
      Promise.resolve(onEvidenceChanged()),
    ]);
  }

  return (
    <>
      <Surface className="student-evidence-record">
        <header className="student-evidence-record__header">
          <p>Student evidence</p>
          <h2>Bukti perkembangan</h2>
          <span>Foto dan metadata menjadi bagian dari record perkembangan siswa.</span>
        </header>

        <EvidenceUploadForm
          demoReadOnly={demoReadOnly}
          onUpload={handleUpload}
        />

        <div className="student-evidence-history">
          <div className="student-evidence-history__heading">
            <p>Evidence history</p>
            <h3>Daftar bukti perkembangan</h3>
          </div>
          <p
            className="student-evidence-history__status"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>

          {resource.status === "loading" && (
            <LoadingState label="Memuat evidence siswa..." />
          )}
          {resource.status === "error" && (
            <ErrorState message={resource.error} onRetry={() => loadEvidences()} />
          )}
          {resource.status === "success" && resource.data.length === 0 && (
            <EmptyState title="Belum ada bukti perkembangan untuk siswa ini." />
          )}
          {resource.status === "success" && resource.data.length > 0 && (
            <ol className="student-evidence-history__list">
              {resource.data.map((evidence, index) => (
                <li key={evidence.id}>
                  <span className="student-evidence-history__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className="student-evidence-history__thumbnail"
                    onClick={(event) => {
                      rememberTrigger(event);
                      setViewingEvidence(evidence);
                    }}
                    aria-label={`Buka viewer ${evidence.title}`}
                  >
                    {evidence.file?.url ? (
                      <img src={evidence.file.url} alt="" />
                    ) : (
                      <span className="student-evidence-history__thumbnail-placeholder">
                        Preview tidak tersedia
                      </span>
                    )}
                  </button>
                  <div className="student-evidence-history__copy">
                    <div>
                      <span>{evidenceCategoryLabels[evidence.category] || evidence.category}</span>
                      <time dateTime={evidence.observedAt}>
                        {formatRecordedDate(evidence.observedAt, "Tanggal tidak tersedia")}
                      </time>
                    </div>
                    <h4>{evidence.title}</h4>
                    {evidence.description && <p>{evidence.description}</p>}
                    <small>
                      Guru: {evidence.teacher?.name || "-"} · {(evidence.file?.format || "").toUpperCase()} · {formatEvidenceFileSize(evidence.file?.size)}
                    </small>
                    <div className="student-evidence-history__actions">
                      <button
                        type="button"
                        disabled={demoReadOnly}
                        onClick={(event) => {
                          if (demoReadOnly) return;
                          rememberTrigger(event);
                          setEditingEvidence(evidence);
                        }}
                      >
                        Edit metadata
                      </button>
                      <button
                        type="button"
                        className="student-evidence-history__retract"
                        disabled={demoReadOnly}
                        onClick={(event) => {
                          if (demoReadOnly) return;
                          rememberTrigger(event);
                          setRetractingEvidence(evidence);
                        }}
                      >
                        Cabut evidence
                      </button>
                      {demoReadOnly && (
                        <span className="text-xs text-[var(--muted)]">
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
      </Surface>

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
