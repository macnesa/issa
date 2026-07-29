import baseUrl from "../config/api";
import { reportApiConnection } from "./connectionStatus";
import {
  assertTeacherMutationAllowed,
  readApiError,
} from "../auth/demoAccess";

export class TeacherSyncApiError extends Error {
  constructor(message, status, code = null) {
    super(message);
    this.name = "TeacherSyncApiError";
    this.status = status;
    this.code = code;
  }
}

function toServerMutation(mutation) {
  return {
    clientMutationId: mutation.clientMutationId,
    type: mutation.type,
    baseVersion: mutation.baseVersion,
    payload: mutation.payload,
    createdAt: mutation.createdAt,
  };
}

export async function submitTeacherSyncBatch(
  mutations,
  {
    fetchImplementation = fetch,
    token = localStorage.getItem("access_token"),
  } = {}
) {
  assertTeacherMutationAllowed(token);
  if (!Array.isArray(mutations) || mutations.length < 1 || mutations.length > 50) {
    throw new Error("Sync batch must contain 1 to 50 mutations.");
  }

  let response;
  try {
    response = await fetchImplementation(`${baseUrl}/teachers/me/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      body: JSON.stringify({
        mutations: mutations.map(toServerMutation),
      }),
    });
    reportApiConnection(true);
  } catch (error) {
    reportApiConnection(false);
    throw error;
  }

  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch (error) {
    responseBody = null;
  }
  if (!response.ok) {
    const apiError = readApiError(
      responseBody,
      "Sinkronisasi belum dapat diproses.",
      response.status
    );
    throw new TeacherSyncApiError(
      apiError.message,
      response.status,
      apiError.code || null
    );
  }
  return {
    results: Array.isArray(responseBody?.results)
      ? responseBody.results
      : [],
  };
}

export { toServerMutation };
