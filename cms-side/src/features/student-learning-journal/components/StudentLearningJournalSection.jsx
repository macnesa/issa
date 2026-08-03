import { tw } from "../../../shared/ui/tw";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  LedgerShell,
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
import { isNetworkFailure } from "../../../offline-workspace/networkErrors";

const emptyCachedEntries = Object.freeze([]);
const ignoreJournalLoaded = () => {};

export default function StudentLearningJournalSection({
  studentId,
  refreshKey = 0,
  cachedEntries = emptyCachedEntries,
  demoReadOnly = false,
  hasCachedSnapshot = false,
  offlineReadOnly = false,
  onJournalLoaded = ignoreJournalLoaded,
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
  const cachedEntriesRef = useRef(cachedEntries);
  const hasCachedSnapshotRef = useRef(hasCachedSnapshot);

  useEffect(() => {
    cachedEntriesRef.current = cachedEntries;
    hasCachedSnapshotRef.current = hasCachedSnapshot;
  }, [cachedEntries, hasCachedSnapshot]);

  const loadJournal = useCallback(async ({ signal } = {}) => {
    const requestId = ++journalRequestSequence.current;
    setResource((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const entries = await fetchStudentLearningJournal(studentId, { signal });
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      setResource({ status: "success", data: entries, error: "" });
      await Promise.resolve(onJournalLoaded(entries));
    } catch (error) {
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      if (isNetworkFailure(error) && hasCachedSnapshotRef.current) {
        setResource({
          status: "success",
          data: cachedEntriesRef.current,
          error: "",
        });
        return;
      }
      setResource({
        status: "error",
        data: [],
        error: error?.message || "Jurnal belajar belum dapat dimuat.",
      });
    }
  }, [onJournalLoaded, studentId]);

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
    if (demoReadOnly) return;
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
    if (demoReadOnly) return;
    await refetchAfterAuthorizationError(() => (
      retractStudentLearningJournalEntry(studentId, entry.id)
    ));
    if (editingEntry?.id === entry.id) setEditingEntry(null);
    await loadJournal();
  }

  function handleEdit(entry) {
    if (demoReadOnly) return;
    setEditingEntry(entry);
  }

  const journalError = resource.error === "Jurnal belajar belum dapat dimuat."
    ? resource.error
    : `Jurnal belajar belum dapat dimuat. ${resource.error}`;

  return (
    <LedgerShell
      className={tw("student-learning-journal min-w-0")}
      eyebrow="Shared learning journal"
      title="Perjalanan belajar"
      description="Catatan ini akan dibagikan kepada orang tua siswa."
    >

      <JournalEntryForm
        editingEntry={editingEntry}
        evidences={evidenceResource.data}
        evidenceStatus={evidenceResource.status}
        evidenceError={evidenceResource.error}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingEntry(null)}
        demoReadOnly={demoReadOnly}
        readOnly={offlineReadOnly || demoReadOnly}
      />

      <div aria-live="polite" aria-busy={resource.status === "loading"}>
        {resource.status === "loading" && (
          <div className={tw("student-learning-journal__state p-4")}>
            <LoadingState label="Memuat jurnal belajar siswa..." />
          </div>
        )}
        {resource.status === "error" && (
          <div className={tw("student-learning-journal__state p-4")}>
            <ErrorState
              message={journalError}
              onRetry={() => loadJournal()}
            />
          </div>
        )}
        {resource.status === "success" && resource.data.length === 0 && (
          <div className={tw("student-learning-journal__state p-4")}>
            <EmptyState title="Belum ada catatan perjalanan belajar untuk siswa ini." />
          </div>
        )}
        {resource.status === "success" && resource.data.length > 0 && (
          <JournalTimeline
            entries={resource.data}
            onEdit={handleEdit}
            onRetract={handleRetract}
            demoReadOnly={demoReadOnly}
            readOnly={offlineReadOnly || demoReadOnly}
          />
        )}
      </div>
    </LedgerShell>
  );
}
