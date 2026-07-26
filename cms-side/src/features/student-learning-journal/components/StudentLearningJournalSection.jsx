import { useCallback, useEffect, useRef, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Surface,
} from "../../../shared/ui/ui";
import { fetchStudentEvidences } from "../../student-evidence/studentEvidenceApi";
import {
  createStudentLearningJournalEntry,
  fetchStudentLearningJournal,
  retractStudentLearningJournalEntry,
  updateStudentLearningJournalEntry,
} from "../studentLearningJournalApi";
import JournalEntryForm from "./JournalEntryForm";
import JournalTimeline from "./JournalTimeline";
import "./StudentLearningJournalSection.css";

export default function StudentLearningJournalSection({
  studentId,
  refreshKey = 0,
}) {
  const [resource, setResource] = useState({
    status: "loading",
    data: [],
    error: "",
  });
  const [evidenceResource, setEvidenceResource] = useState({
    status: "loading",
    data: [],
    error: "",
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const journalRequestSequence = useRef(0);
  const evidenceRequestSequence = useRef(0);

  const loadJournal = useCallback(async ({ signal } = {}) => {
    const requestId = ++journalRequestSequence.current;
    setResource((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const entries = await fetchStudentLearningJournal(studentId, { signal });
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      setResource({ status: "success", data: entries, error: "" });
    } catch (error) {
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      setResource({
        status: "error",
        data: [],
        error: error?.message || "Jurnal belajar belum dapat dimuat.",
      });
    }
  }, [studentId]);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    const requestId = ++evidenceRequestSequence.current;
    setEvidenceResource((current) => ({
      ...current,
      status: "loading",
      error: "",
    }));
    try {
      const evidences = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== evidenceRequestSequence.current) return;
      setEvidenceResource({ status: "success", data: evidences, error: "" });
    } catch (error) {
      if (signal?.aborted || requestId !== evidenceRequestSequence.current) return;
      setEvidenceResource({
        status: "error",
        data: [],
        error: error?.message || "Evidence siswa belum dapat dimuat.",
      });
    }
  }, [studentId]);

  useEffect(() => {
    const journalController = new AbortController();
    const evidenceController = new AbortController();
    loadJournal({ signal: journalController.signal });
    loadEvidences({ signal: evidenceController.signal });
    return () => {
      journalController.abort();
      evidenceController.abort();
    };
  }, [loadEvidences, loadJournal, refreshKey]);

  async function refetchAfterAuthorizationError(operation) {
    try {
      return await operation();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        await loadJournal();
      }
      throw error;
    }
  }

  async function handleSubmit(payload) {
    if (editingEntry) {
      await refetchAfterAuthorizationError(() => (
        updateStudentLearningJournalEntry(
          studentId,
          editingEntry.id,
          payload
        )
      ));
      setEditingEntry(null);
    } else {
      await refetchAfterAuthorizationError(() => (
        createStudentLearningJournalEntry(studentId, payload)
      ));
    }
    await loadJournal();
  }

  async function handleRetract(entry) {
    await refetchAfterAuthorizationError(() => (
      retractStudentLearningJournalEntry(studentId, entry.id)
    ));
    if (editingEntry?.id === entry.id) setEditingEntry(null);
    await loadJournal();
  }

  function handleEdit(entry) {
    setEditingEntry(entry);
  }

  const journalError = resource.error === "Jurnal belajar belum dapat dimuat."
    ? resource.error
    : `Jurnal belajar belum dapat dimuat. ${resource.error}`;

  return (
    <Surface className="student-learning-journal">
      <header className="student-learning-journal__header">
        <p>Shared learning journal</p>
        <h2>Perjalanan belajar</h2>
        <span>Catatan ini akan dibagikan kepada orang tua siswa.</span>
      </header>

      <JournalEntryForm
        editingEntry={editingEntry}
        evidences={evidenceResource.data}
        evidenceStatus={evidenceResource.status}
        evidenceError={evidenceResource.error}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingEntry(null)}
      />

      <div aria-live="polite" aria-busy={resource.status === "loading"}>
        {resource.status === "loading" && (
          <div className="student-learning-journal__state">
            <LoadingState label="Memuat jurnal belajar siswa..." />
          </div>
        )}
        {resource.status === "error" && (
          <div className="student-learning-journal__state">
            <ErrorState
              message={journalError}
              onRetry={() => loadJournal()}
            />
          </div>
        )}
        {resource.status === "success" && resource.data.length === 0 && (
          <div className="student-learning-journal__state">
            <EmptyState title="Belum ada catatan perjalanan belajar untuk siswa ini." />
          </div>
        )}
        {resource.status === "success" && resource.data.length > 0 && (
          <JournalTimeline
            entries={resource.data}
            onEdit={handleEdit}
            onRetract={handleRetract}
          />
        )}
      </div>
    </Surface>
  );
}
