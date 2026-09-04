import { tw } from "../../../shared/ui/tw";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  LedgerShell,
} from "../../../shared/ui/ui";
import {
  RESOURCE_PROVENANCE,
  RESOURCE_STATUS,
  resourceError,
  resourceFromData,
  resourceLoading,
  resourcePartial,
} from "../../../shared/data/resourceTruth";
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
  const [resource, setResource] = useState(() => resourceLoading({ data: [], scope: "journal" }));
  const [evidenceResource, setEvidenceResource] = useState(() => resourceLoading({ data: [], scope: "evidence" }));
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
    setResource((current) => resourceLoading({
      data: current.data || [],
      provenance: current.provenance,
      scope: "journal",
    }));
    try {
      const entries = await fetchStudentLearningJournal(studentId, { signal });
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      const nextResource = resourceFromData(entries, {
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "journal",
      });
      setResource(nextResource);
      await Promise.resolve(onJournalLoaded(entries, nextResource));
    } catch (error) {
      if (signal?.aborted || requestId !== journalRequestSequence.current) return;
      if (isNetworkFailure(error) && hasCachedSnapshotRef.current) {
        const entries = cachedEntriesRef.current;
        const nextResource = resourcePartial(entries, {
          provenance: RESOURCE_PROVENANCE.SNAPSHOT,
          scope: "journal",
          reason: "Jurnal ditampilkan dari snapshot offline dan mungkin tidak mencakup perubahan terbaru.",
        });
        setResource(nextResource);
        await Promise.resolve(onJournalLoaded(entries, nextResource));
        return;
      }
      setResource(resourceError(error?.message || "Jurnal belajar belum dapat dimuat.", {
        data: [],
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "journal",
      }));
    }
  }, [onJournalLoaded, studentId]);

  const loadEvidences = useCallback(async ({ signal } = {}) => {
    const requestId = ++evidenceRequestSequence.current;
    setEvidenceResource((current) => resourceLoading({
      data: current.data || [],
      provenance: current.provenance,
      scope: "evidence",
    }));
    try {
      const evidences = await fetchStudentEvidences(studentId, { signal });
      if (signal?.aborted || requestId !== evidenceRequestSequence.current) return;
      setEvidenceResource(resourceFromData(evidences, {
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "evidence",
      }));
    } catch (error) {
      if (signal?.aborted || requestId !== evidenceRequestSequence.current) return;
      setEvidenceResource(resourceError(error?.message || "Bukti siswa belum dapat dimuat.", {
        data: [],
        provenance: RESOURCE_PROVENANCE.SERVER,
        scope: "evidence",
      }));
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
  const journalHasEntries = Array.isArray(resource.data) && resource.data.length > 0;
  const journalIsPartial = resource.status === RESOURCE_STATUS.PARTIAL;

  return (
    <LedgerShell
      className={tw("student-learning-journal min-w-0")}
      eyebrow="Jurnal guru"
      title="Perjalanan belajar"
      description="Catatan ini akan dibagikan kepada orang tua siswa."
    >
      <JournalEntryForm
        editingEntry={editingEntry}
        evidences={Array.isArray(evidenceResource.data) ? evidenceResource.data : []}
        evidenceStatus={evidenceResource.status}
        evidenceError={evidenceResource.error}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingEntry(null)}
        demoReadOnly={demoReadOnly}
        readOnly={offlineReadOnly || demoReadOnly}
      />

      <div aria-live="polite" aria-busy={resource.status === RESOURCE_STATUS.LOADING}>
        {resource.status === RESOURCE_STATUS.LOADING && (
          <div className={tw("student-learning-journal__state p-4")}>
            <LoadingState label="Memuat jurnal belajar siswa..." />
          </div>
        )}
        {resource.status === RESOURCE_STATUS.ERROR && (
          <div className={tw("student-learning-journal__state p-4")}>
            <ErrorState
              message={journalError}
              onRetry={() => loadJournal()}
            />
          </div>
        )}
        {resource.status === RESOURCE_STATUS.EMPTY && (
          <div className={tw("student-learning-journal__state p-4")}>
            <EmptyState title="Belum ada catatan perjalanan belajar untuk siswa ini." />
          </div>
        )}
        {journalIsPartial && (
          <InlineNotice className={tw("m-4")} tone="warning" role="note">
            {resource.reason || "Jurnal menggunakan snapshot offline dan mungkin tidak lengkap."}
          </InlineNotice>
        )}
        {journalIsPartial && !journalHasEntries && (
          <div className={tw("student-learning-journal__state px-4 pb-4")}>
            <EmptyState
              title="Tidak ada catatan dalam snapshot offline ini."
              description="Ini tidak membuktikan bahwa histori jurnal server kosong. Hubungkan kembali untuk memeriksa data terbaru."
            />
          </div>
        )}
        {[RESOURCE_STATUS.KNOWN, RESOURCE_STATUS.PARTIAL].includes(resource.status) && journalHasEntries && (
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
