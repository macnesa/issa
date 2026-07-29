import { deleteDB, openDB } from "idb";

export const offlineDatabaseName = "issa-teacher-offline";
export const offlineDatabaseVersion = 1;

export const offlineStores = Object.freeze({
  workspaceSnapshots: "workspaceSnapshots",
  pendingMutations: "pendingMutations",
  syncConflicts: "syncConflicts",
  syncMetadata: "syncMetadata",
});

let databasePromise;

function createIndex(store, name, keyPath, options) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

export function openOfflineDatabase() {
  void "ISSA:CMS.OFFLINE_WORKSPACE.INITIALIZE_DATABASE";
  if (!databasePromise) {
    databasePromise = openDB(offlineDatabaseName, offlineDatabaseVersion, {
      upgrade(database) {
        const snapshots = database.objectStoreNames.contains(
          offlineStores.workspaceSnapshots
        )
          ? null
          : database.createObjectStore(offlineStores.workspaceSnapshots, {
            keyPath: ["teacherId", "studentId"],
          });
        if (snapshots) {
          createIndex(snapshots, "teacherId", "teacherId");
          createIndex(snapshots, "studentId", "studentId");
          createIndex(snapshots, "updatedAt", "updatedAt");
        }

        const pending = database.objectStoreNames.contains(
          offlineStores.pendingMutations
        )
          ? null
          : database.createObjectStore(offlineStores.pendingMutations, {
            keyPath: "clientMutationId",
          });
        if (pending) {
          createIndex(pending, "teacherId", "teacherId");
          createIndex(pending, "status", "status");
          createIndex(pending, "nextAttemptAt", "nextAttemptAt");
          createIndex(pending, "entityKey", "entityKey");
          createIndex(pending, "createdAt", "createdAt");
        }

        const conflicts = database.objectStoreNames.contains(
          offlineStores.syncConflicts
        )
          ? null
          : database.createObjectStore(offlineStores.syncConflicts, {
            keyPath: "clientMutationId",
          });
        if (conflicts) {
          createIndex(conflicts, "teacherId", "teacherId");
          createIndex(conflicts, "createdAt", "createdAt");
        }

        if (!database.objectStoreNames.contains(offlineStores.syncMetadata)) {
          database.createObjectStore(offlineStores.syncMetadata, {
            keyPath: "teacherId",
          });
        }
      },
      terminated() {
        databasePromise = undefined;
      },
    });
  }
  return databasePromise;
}

export async function closeOfflineDatabase() {
  if (!databasePromise) return;
  const database = await databasePromise;
  database.close();
  databasePromise = undefined;
}

export async function deleteOfflineDatabaseForTests() {
  await closeOfflineDatabase();
  await deleteDB(offlineDatabaseName);
}
