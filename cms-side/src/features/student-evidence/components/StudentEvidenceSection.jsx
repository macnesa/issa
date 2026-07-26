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
} from "../studentEvidenceApi";
import {
  evidenceCategoryLabels,
  formatEvidenceFileSize,
} from "../studentEvidence.constants";
import EvidenceUploadForm from "./EvidenceUploadForm";
import "./StudentEvidenceSection.css";

export default function StudentEvidenceSection({ studentId }) {
  const [resource, setResource] = useState({
    status: "loading",
    data: [],
    error: "",
  });
  const requestSequence = useRef(0);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    const requestId = ++requestSequence.current;
    setResource((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const evidenceList = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setResource({ status: "success", data: evidenceList, error: "" });
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
    await createStudentEvidence(studentId, evidenceFormData);
    await loadEvidences();
  }

  return (
    <Surface className="student-evidence-record">
      <header className="student-evidence-record__header">
        <p>Student evidence</p>
        <h2>Bukti perkembangan</h2>
        <span>Foto dan metadata menjadi bagian dari record perkembangan siswa.</span>
      </header>

      <EvidenceUploadForm onUpload={handleUpload} />

      <div className="student-evidence-history">
        <div className="student-evidence-history__heading">
          <p>Evidence history</p>
          <h3>Daftar bukti perkembangan</h3>
        </div>

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
                <img src={evidence.file?.url} alt={evidence.title} />
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
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Surface>
  );
}
