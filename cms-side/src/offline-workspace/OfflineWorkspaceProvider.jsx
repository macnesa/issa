import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getActiveTeacherIdentity,
  isTeacherDemoSession,
} from "./authIdentity";
import {
  getOnlineHint,
  subscribeToApiConnection,
  subscribeToConnectionStatus,
} from "./connectionStatus";
import { openOfflineDatabase } from "./offlineDatabase";
import {
  getSyncMetadata,
  listSyncConflicts,
  listTeacherMutations,
  resetInterruptedSyncingMutations,
  updateSyncMetadata,
} from "./mutationQueue";
import { createTeacherSyncEngine } from "./syncEngine";
import { subscribeToOfflineWorkspaceChanges } from "./offlineEvents";

const initialStatus = {
  initialized: false,
  onlineHint: getOnlineHint(),
  syncRunning: false,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastSuccessfulSyncAt: null,
  authRequired: false,
  apiReachable: null,
  conflicts: [],
  failedMutations: [],
  mutations: [],
};

const OfflineWorkspaceContext = createContext({
  ...initialStatus,
  teacherIdentity: null,
  isDemo: false,
  refreshStatus: async () => {},
  syncNow: async () => ({ status: "unavailable" }),
});

export function OfflineWorkspaceProvider({ children }) {
  const [teacherIdentity, setTeacherIdentity] = useState(
    getActiveTeacherIdentity
  );
  const [status, setStatus] = useState(() => ({
    ...initialStatus,
    onlineHint: getOnlineHint(),
  }));
  const engineRef = useRef(null);
  const teacherId = teacherIdentity?.id || null;
  const isDemo = isTeacherDemoSession();

  const refreshStatus = useCallback(async () => {
    if (!teacherId || isDemo) {
      setStatus((current) => ({
        ...initialStatus,
        initialized: true,
        onlineHint: current.onlineHint,
      }));
      return;
    }
    const [mutations, conflicts, metadata] = await Promise.all([
      listTeacherMutations(teacherId),
      listSyncConflicts(teacherId),
      getSyncMetadata(teacherId),
    ]);
    const pending = mutations.filter((mutation) => (
      mutation.status === "pending" || mutation.status === "syncing"
    ));
    const failed = mutations.filter((mutation) => (
      mutation.status === "failed"
    ));
    setStatus((current) => ({
      ...current,
      initialized: true,
      pendingCount: pending.length,
      failedCount: failed.length,
      conflictCount: conflicts.length,
      lastSuccessfulSyncAt: metadata?.lastSuccessfulSyncAt || null,
      authRequired: Boolean(metadata?.authRequired),
      conflicts,
      failedMutations: failed,
      mutations,
    }));
  }, [isDemo, teacherId]);

  const syncNow = useCallback(async () => {
    if (isDemo) return { status: "demo-read-only" };
    if (!engineRef.current) return { status: "unavailable" };
    const result = await engineRef.current.syncNow();
    await refreshStatus();
    return result;
  }, [isDemo, refreshStatus]);

  useEffect(() => {
    const refreshIdentity = () => setTeacherIdentity(
      getActiveTeacherIdentity()
    );
    window.addEventListener("issa:teacher-identity-changed", refreshIdentity);
    return () => {
      window.removeEventListener(
        "issa:teacher-identity-changed",
        refreshIdentity
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    engineRef.current?.dispose();
    engineRef.current = null;

    if (!teacherId || isDemo) {
      refreshStatus();
      return undefined;
    }

    const engine = createTeacherSyncEngine({
      teacherId,
      isOnline: getOnlineHint,
      onStateChange: ({ running }) => {
        if (cancelled) return;
        setStatus((current) => ({ ...current, syncRunning: running }));
        refreshStatus();
      },
    });
    engineRef.current = engine;

    const initialize = async () => {
      await openOfflineDatabase();
      await resetInterruptedSyncingMutations(teacherId);
      await updateSyncMetadata(teacherId, {
        identity: {
          id: teacherId,
          name: teacherIdentity?.name || "",
        },
      });
      if (cancelled) return;
      await refreshStatus();
      if (getOnlineHint()) await engine.syncNow();
    };
    initialize().catch(() => {
      if (!cancelled) {
        setStatus((current) => ({ ...current, initialized: true }));
      }
    });

    const unsubscribeConnection = subscribeToConnectionStatus((onlineHint) => {
      if (cancelled) return;
      setStatus((current) => ({
        ...current,
        onlineHint,
        apiReachable: onlineHint ? null : false,
      }));
      if (onlineHint) engine.syncNow();
    });
    const unsubscribeApiConnection = subscribeToApiConnection(
      (apiReachable) => {
        if (cancelled) return;
        setStatus((current) => ({ ...current, apiReachable }));
      }
    );
    const handleMutationEnqueued = (event) => {
      if (Number(event.detail?.teacherId) !== Number(teacherId)) return;
      refreshStatus();
      if (getOnlineHint()) engine.syncNow();
    };
    window.addEventListener(
      "issa:offline-mutation-enqueued",
      handleMutationEnqueued
    );
    const unsubscribeWorkspaceChanges = subscribeToOfflineWorkspaceChanges(
      (event) => {
        if (Number(event.detail?.teacherId) !== Number(teacherId)) return;
        refreshStatus();
      }
    );

    return () => {
      cancelled = true;
      unsubscribeConnection();
      unsubscribeApiConnection();
      window.removeEventListener(
        "issa:offline-mutation-enqueued",
        handleMutationEnqueued
      );
      unsubscribeWorkspaceChanges();
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [isDemo, refreshStatus, teacherId, teacherIdentity?.name]);

  const contextValue = useMemo(() => ({
    ...status,
    connectionAvailable: status.onlineHint && status.apiReachable !== false,
    isDemo,
    teacherIdentity,
    refreshStatus,
    syncNow,
  }), [isDemo, refreshStatus, status, syncNow, teacherIdentity]);

  return (
    <OfflineWorkspaceContext.Provider value={contextValue}>
      {children}
    </OfflineWorkspaceContext.Provider>
  );
}

export function useOfflineWorkspace() {
  return useContext(OfflineWorkspaceContext);
}
