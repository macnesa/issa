import { isTeacherDemoSession } from "../offline-workspace/authIdentity";

export const DEMO_READ_ONLY_CODE = "publicDemoReadOnly";
export const DEMO_READ_ONLY_MESSAGE =
  "Perubahan data tidak tersedia dalam mode demo.";
export const DEMO_ACTION_UNAVAILABLE_MESSAGE =
  "Tidak tersedia dalam mode demo.";
export const DEMO_AI_RATE_LIMIT_MESSAGE =
  "Batas penggunaan demo telah tercapai. Coba lagi nanti.";

export class TeacherDemoReadOnlyError extends Error {
  constructor(message = DEMO_READ_ONLY_MESSAGE) {
    super(message);
    this.name = "TeacherDemoReadOnlyError";
    this.status = 403;
    this.code = DEMO_READ_ONLY_CODE;
  }
}

export function assertTeacherMutationAllowed(
  token = localStorage.getItem("access_token")
) {
  if (isTeacherDemoSession(token)) {
    throw new TeacherDemoReadOnlyError();
  }
}

export function readApiError(responseBody, fallbackMessage, status) {
  const nestedError = responseBody?.error
    && typeof responseBody.error === "object"
    ? responseBody.error
    : null;
  const code = nestedError?.code || responseBody?.code || "";

  if (status === 403 && code === DEMO_READ_ONLY_CODE) {
    return {
      code,
      message: DEMO_READ_ONLY_MESSAGE,
    };
  }

  return {
    code,
    message: nestedError?.message
      || responseBody?.message
      || responseBody?.msg
      || fallbackMessage,
  };
}
