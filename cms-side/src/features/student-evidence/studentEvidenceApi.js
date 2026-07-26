import baseUrl from "../../config/api";

export class StudentEvidenceApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "StudentEvidenceApiError";
    this.status = status;
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
    throw new StudentEvidenceApiError(
      responseBody?.msg || fallbackMessage,
      response.status
    );
  }

  return responseBody;
}

export async function fetchStudentEvidences(studentId, { signal } = {}) {
  const response = await fetch(`${baseUrl}/students/${studentId}/evidences`, {
    headers: {
      access_token: localStorage.access_token,
    },
    signal,
  });

  const evidenceList = await parseResponse(
    response,
    "Bukti perkembangan belum dapat dimuat."
  );
  return Array.isArray(evidenceList) ? evidenceList : [];
}

export async function createStudentEvidence(studentId, evidenceFormData) {
  const response = await fetch(`${baseUrl}/students/${studentId}/evidences`, {
    method: "POST",
    headers: {
      access_token: localStorage.access_token,
    },
    body: evidenceFormData,
  });

  return parseResponse(response, "Bukti perkembangan gagal disimpan.");
}

function metadataRequestHeaders() {
  return {
    "Content-Type": "application/json",
    access_token: localStorage.access_token,
  };
}

export async function updateStudentEvidenceMetadata(
  studentId,
  evidenceId,
  metadata
) {
  const response = await fetch(
    `${baseUrl}/students/${studentId}/evidences/${evidenceId}`,
    {
      method: "PATCH",
      headers: metadataRequestHeaders(),
      body: JSON.stringify(metadata),
    }
  );

  return parseResponse(response, "Koreksi evidence gagal disimpan.");
}

export async function retractStudentEvidence(studentId, evidenceId, reason) {
  const response = await fetch(
    `${baseUrl}/students/${studentId}/evidences/${evidenceId}`,
    {
      method: "DELETE",
      headers: metadataRequestHeaders(),
      body: JSON.stringify({ reason }),
    }
  );

  return parseResponse(response, "Evidence gagal dicabut.");
}
