import {
  listPendingMutations,
  markMutationFailed,
  markMutationPending,
  markMutationSyncing,
  removeConflict,
  removeMutation,
  saveConflict,
  updateSyncMetadata,
} from "./mutationQueue";
import { submitTeacherSyncBatch } from "./syncApi";
import { mergeAttendanceServerRecord } from "./workspaceSnapshots";

export const maximumSyncBatchSize = 50;
export const maximumRetryDelayMs = 30000;

export function calculateBackoffDelay(
  attemptCount,
  random = Math.random
) {
  const normalizedAttempt = Math.max(1, Number(attemptCount) || 1);
  const baseDelay = Math.min(
    maximumRetryDelayMs,
    1000 * (2 ** (normalizedAttempt - 1))
  );
  const jitter = 0.85 + (Math.max(0, Math.min(1, random())) * 0.3);
  return Math.min(maximumRetryDelayMs, Math.round(baseDelay * jitter));
}

function safeError(error) {
  return {
    code: error?.code || (
      error?.status ? `http_${error.status}` : "network_error"
    ),
    message: error?.message || "Sinkronisasi belum dapat diproses.",
  };
}

async function returnBatchToPending(
  mutations,
  {
    incrementAttempt,
    error,
    now,
    random,
  }
) {
  const timestamp = now();
  const normalizedError = safeError(error);
  await Promise.all(mutations.map((mutation) => {
    const nextAttemptNumber = mutation.attemptCount + (
      incrementAttempt ? 1 : 0
    );
    const nextAttemptAt = incrementAttempt
      ? new Date(
        timestamp.getTime() + calculateBackoffDelay(nextAttemptNumber, random)
      ).toISOString()
      : mutation.nextAttemptAt;
    return markMutationPending(mutation.clientMutationId, {
      incrementAttempt,
      nextAttemptAt,
      lastErrorCode: normalizedError.code,
      lastErrorMessage: normalizedError.message,
      updatedAt: timestamp.toISOString(),
    });
  }));
}

export async function reconcileSyncResults({
  teacherId,
  mutations,
  results,
  now = () => new Date(),
  random = Math.random,
}) {
  void "ISSA:CMS.OFFLINE_WORKSPACE.RECONCILE_SYNC_RESULT";
  const resultByMutationId = new Map(
    (Array.isArray(results) ? results : [])
      .filter((result) => typeof result?.clientMutationId === "string")
      .map((result) => [result.clientMutationId, result])
  );
  const reconciliation = [];

  for (const mutation of mutations) {
    const result = resultByMutationId.get(mutation.clientMutationId);
    if (!result) {
      await returnBatchToPending([mutation], {
        incrementAttempt: true,
        error: {
          code: "missing_sync_result",
          message: "Server tidak mengembalikan hasil mutation.",
        },
        now,
        random,
      });
      reconciliation.push({
        clientMutationId: mutation.clientMutationId,
        status: "pending",
      });
      continue;
    }

    if (result.status === "applied" || result.status === "duplicate") {
      if (
        mutation.type === "attendance.update"
        && result.serverRecord?.attendanceDate
      ) {
        await mergeAttendanceServerRecord({
          teacherId,
          studentId: mutation.payload.studentId,
          serverRecord: result.serverRecord,
        });
      }
      await removeMutation(mutation.clientMutationId);
      await removeConflict(mutation.clientMutationId);
      reconciliation.push({
        clientMutationId: mutation.clientMutationId,
        serverRecord: result.serverRecord || null,
        status: result.status,
      });
      continue;
    }

    if (result.status === "conflict") {
      await saveConflict({
        mutation,
        conflict: result.conflict || null,
        createdAt: now().toISOString(),
      });
      await removeMutation(mutation.clientMutationId);
      reconciliation.push({
        clientMutationId: mutation.clientMutationId,
        status: "conflict",
      });
      continue;
    }

    if (result.status === "rejected") {
      await markMutationFailed(
        mutation.clientMutationId,
        result.error || {}
      );
      reconciliation.push({
        clientMutationId: mutation.clientMutationId,
        status: "rejected",
      });
      continue;
    }

    await returnBatchToPending([mutation], {
      incrementAttempt: true,
      error: {
        code: "unknown_sync_result",
        message: "Status hasil sinkronisasi tidak dikenali.",
      },
      now,
      random,
    });
    reconciliation.push({
      clientMutationId: mutation.clientMutationId,
      status: "pending",
    });
  }

  await updateSyncMetadata(teacherId, {
    authRequired: false,
    lastBatchStatus: "processed",
    lastErrorCode: null,
    lastSuccessfulSyncAt: now().toISOString(),
  });
  return reconciliation;
}

export function createTeacherSyncEngine({
  teacherId,
  requestSync = submitTeacherSyncBatch,
  isOnline = () => navigator.onLine,
  now = () => new Date(),
  random = Math.random,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  onStateChange = () => {},
} = {}) {
  let activePromise = null;
  let retryTimer = null;
  let disposed = false;

  async function scheduleNextAttempt() {
    if (disposed || !isOnline()) return;
    const pending = await listPendingMutations(teacherId);
    if (pending.length === 0) return;
    const earliestTimestamp = Math.min(
      ...pending.map((mutation) => new Date(mutation.nextAttemptAt).getTime())
    );
    const delay = Math.max(0, earliestTimestamp - now().getTime());
    if (retryTimer) clearTimer(retryTimer);
    retryTimer = setTimer(() => {
      retryTimer = null;
      syncNow();
    }, delay);
  }

  async function processPendingBatch() {
    void "ISSA:CMS.OFFLINE_WORKSPACE.PROCESS_PENDING_SYNC_BATCH";
    if (!isOnline()) {
      return { status: "offline", reconciliation: [] };
    }

    const attemptTime = now();
    const mutations = await listPendingMutations(teacherId, {
      dueAt: attemptTime,
      limit: maximumSyncBatchSize,
    });
    if (mutations.length === 0) {
      await scheduleNextAttempt();
      return { status: "idle", reconciliation: [] };
    }

    await Promise.all(mutations.map((mutation) => (
      markMutationSyncing(
        mutation.clientMutationId,
        attemptTime.toISOString()
      )
    )));
    await updateSyncMetadata(teacherId, {
      lastSyncAttemptAt: attemptTime.toISOString(),
      lastBatchStatus: "syncing",
      lastErrorCode: null,
    });
    onStateChange({ running: true });

    try {
      const response = await requestSync(mutations);
      const reconciliation = await reconcileSyncResults({
        teacherId,
        mutations,
        results: response.results,
        now,
        random,
      });
      await scheduleNextAttempt();
      return { status: "processed", reconciliation };
    } catch (error) {
      const authenticationFailure = error?.status === 401 || error?.status === 403;
      await returnBatchToPending(mutations, {
        incrementAttempt: !authenticationFailure,
        error,
        now,
        random,
      });
      await updateSyncMetadata(teacherId, {
        authRequired: authenticationFailure,
        lastBatchStatus: authenticationFailure ? "auth_required" : "retry_scheduled",
        lastErrorCode: safeError(error).code,
      });
      if (!authenticationFailure) await scheduleNextAttempt();
      return {
        status: authenticationFailure ? "auth_required" : "retry_scheduled",
        reconciliation: [],
      };
    }
  }

  function syncNow() {
    if (disposed) return Promise.resolve({ status: "disposed" });
    if (activePromise) return activePromise;
    if (retryTimer) {
      clearTimer(retryTimer);
      retryTimer = null;
    }
    activePromise = processPendingBatch()
      .finally(() => {
        activePromise = null;
        onStateChange({ running: false });
      });
    return activePromise;
  }

  function dispose() {
    disposed = true;
    if (retryTimer) clearTimer(retryTimer);
    retryTimer = null;
  }

  return {
    dispose,
    scheduleNextAttempt,
    syncNow,
  };
}
