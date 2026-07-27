import baseUrl from "../../config/api";
import { aiNarrativeResponseSchema } from "./aiNarrativeSchema";
import type {
  AiNarrativeData,
  AiNarrativeRequest,
} from "./aiNarrativeTypes";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_ai_narrative_request: "Periksa kembali periode dan sumber yang dipilih.",
  student_access_denied: "Anda tidak memiliki akses untuk menyusun draf siswa ini.",
  student_not_found: "Data siswa tidak ditemukan.",
  insufficient_narrative_sources: "Belum tersedia cukup catatan untuk menyusun draf perkembangan.",
  ai_narrative_unavailable: "AI assistant belum tersedia pada server.",
  ai_provider_unavailable: "Draf belum dapat disusun. Coba kembali beberapa saat lagi.",
  ai_generation_invalid_output: "Draf AI tidak dapat digunakan karena tidak sesuai dengan sumber yang tersedia.",
};

export class AiNarrativeRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiNarrativeRequestError";
  }
}

function safeErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.code === "string") return record.code;
  if (record.error && typeof record.error === "object") {
    const error = record.error as Record<string, unknown>;
    if (typeof error.code === "string") return error.code;
  }
  return undefined;
}

export async function generateAiNarrative(
  studentId: string,
  request: AiNarrativeRequest,
): Promise<AiNarrativeData> {
  const response = await fetch(
    `${baseUrl}/students/${studentId}/ai/narrative-draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(request),
    },
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiNarrativeRequestError("Draf belum dapat disusun.");
  }

  if (!response.ok) {
    const code = safeErrorCode(payload);
    throw new AiNarrativeRequestError(
      (code && ERROR_MESSAGES[code]) || "Draf belum dapat disusun.",
    );
  }

  const parsed = aiNarrativeResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AiNarrativeRequestError(
      "Draf tidak dapat ditampilkan karena format respons tidak valid.",
    );
  }

  return parsed.data.data;
}
