import baseUrl from "../../config/api";
import {
  assertTeacherMutationAllowed,
  readApiError,
} from "../../auth/demoAccess";

async function readResponse(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }
  if (!response.ok) {
    const normalizedError = readApiError(
      payload,
      fallbackMessage,
      response.status
    );
    const requestError = new Error(normalizedError.message);
    requestError.code = normalizedError.code;
    requestError.status = response.status;
    const retryAfter = Number(response.headers?.get?.("Retry-After"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      requestError.retryAfterSeconds = Math.ceil(retryAfter);
    }
    throw requestError;
  }
  return payload;
}

function teacherHeaders() {
  return { access_token: localStorage.access_token };
}

export async function fetchDebriefLessons() {
  const response = await fetch(`${baseUrl}/schedules`, {
    headers: teacherHeaders(),
  });
  const schedules = await readResponse(
    response,
    "Konteks lesson belum dapat dimuat."
  );
  const lessonsById = new Map();
  (Array.isArray(schedules) ? schedules : []).forEach((schedule) => {
    const lesson = schedule?.Lesson;
    if (Number.isSafeInteger(Number(lesson?.id))) {
      lessonsById.set(Number(lesson.id), {
        id: Number(lesson.id),
        name: String(lesson.name || "Lesson"),
      });
    }
  });
  return [...lessonsById.values()].sort((left, right) => (
    left.name.localeCompare(right.name, "id")
  ));
}

export async function generateClassroomDebriefDrafts({ text, lessonId }) {
  const requestBody = { text };
  if (lessonId) requestBody.lessonId = Number(lessonId);
  const response = await fetch(
    `${baseUrl}/teachers/me/classroom-debrief/drafts`,
    {
      method: "POST",
      headers: {
        ...teacherHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );
  const payload = await readResponse(
    response,
    "Draf classroom debrief belum dapat dibuat."
  );
  if (!payload?.data || !Array.isArray(payload.data.drafts)) {
    throw new Error("Format draf classroom debrief tidak valid.");
  }
  return payload.data;
}

export async function confirmClassroomDebriefDrafts(items) {
  assertTeacherMutationAllowed();
  const response = await fetch(
    `${baseUrl}/teachers/me/classroom-debrief/confirm`,
    {
      method: "POST",
      headers: {
        ...teacherHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    }
  );
  const payload = await readResponse(
    response,
    "Record classroom debrief belum dapat disimpan."
  );
  if (!payload?.data || !Array.isArray(payload.data.results)) {
    throw new Error("Format hasil konfirmasi tidak valid.");
  }
  return payload.data;
}
