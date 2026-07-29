import type { EditableNarrativeSection } from "./aiNarrativeTypes";

export const SECTION_LABELS: Record<string, string> = {
  summary: "Ringkasan",
  strength: "Kekuatan yang terlihat",
  recent_change: "Perubahan terbaru",
  student_reflection: "Refleksi siswa",
  support_context: "Konteks dukungan",
};

export const SOURCE_LABELS: Record<string, string> = {
  attendance: "Kehadiran",
  score: "Nilai",
  journal: "Jurnal",
  evidence: "Evidence",
  feedback: "Feedback",
};

export function buildFeedbackText(
  title: string,
  sections: EditableNarrativeSection[],
): string {
  const paragraphs = [
    title.trim(),
    ...sections.flatMap((section) => {
      const content = section.text.trim();
      const quote = section.directQuote?.text.trim();
      return [
        content,
        quote ? `“${quote.replace(/^["“]|["”]$/g, "")}”` : "",
      ];
    }),
  ].filter(Boolean);

  return paragraphs.join("\n\n");
}
