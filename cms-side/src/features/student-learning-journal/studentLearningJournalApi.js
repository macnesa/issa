import baseUrl from "../../config/api";
import {
  assertTeacherMutationAllowed,
  readApiError,
} from "../../auth/demoAccess";

export class StudentLearningJournalApiError extends Error {
  constructor(message, status, code = "") {
    super(message);
    this.name = "StudentLearningJournalApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse(response, fallbackMessage) {
  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch (error) {
    responseBody = null;
  }

  if (!response.ok) {
    const apiError = readApiError(responseBody, fallbackMessage, response.status);
    throw new StudentLearningJournalApiError(
      apiError.message,
      response.status,
      apiError.code
    );
  }

  return responseBody;
}

function requestHeaders() {
  return {
    "Content-Type": "application/json",
    access_token: localStorage.access_token,
  };
}

export async function fetchStudentLearningJournal(studentId, { signal } = {}) {
  const response = await fetch(`${baseUrl}/students/${studentId}/journal`, {
    headers: { access_token: localStorage.access_token },
    signal,
  });
  const entries = await parseResponse(
    response,
    "Jurnal belajar belum dapat dimuat."
  );
  return Array.isArray(entries) ? entries : [];
}

export async function createStudentLearningJournalEntry(studentId, payload) {
  assertTeacherMutationAllowed();
  const response = await fetch(`${baseUrl}/students/${studentId}/journal`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Catatan perjalanan belajar gagal disimpan.");
}

export async function updateStudentLearningJournalEntry(
  studentId,
  entryId,
  payload
) {
  assertTeacherMutationAllowed();
  const response = await fetch(
    `${baseUrl}/students/${studentId}/journal/${entryId}`,
    {
      method: "PATCH",
      headers: requestHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return parseResponse(response, "Koreksi catatan gagal disimpan.");
}

export async function retractStudentLearningJournalEntry(studentId, entryId) {
  assertTeacherMutationAllowed();
  const response = await fetch(
    `${baseUrl}/students/${studentId}/journal/${entryId}`,
    {
      method: "DELETE",
      headers: { access_token: localStorage.access_token },
    }
  );
  return parseResponse(response, "Catatan perjalanan belajar gagal dicabut.");
}
