export const evidenceCategoryOptions = [
  { value: "work", label: "Karya" },
  { value: "assignment", label: "Tugas" },
  { value: "assessment", label: "Penilaian" },
  { value: "activity", label: "Aktivitas" },
  { value: "documentation", label: "Dokumentasi" },
];

export const evidenceCategoryLabels = Object.fromEntries(
  evidenceCategoryOptions.map(({ value, label }) => [value, label])
);

export const supportedEvidenceMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const maximumEvidenceFileSize = 5 * 1024 * 1024;

export function formatEvidenceFileSize(fileSize) {
  const numericSize = Number(fileSize);
  if (!Number.isFinite(numericSize) || numericSize < 0) return "Ukuran tidak tersedia";
  if (numericSize < 1024) return `${numericSize} B`;
  if (numericSize < 1024 * 1024) return `${(numericSize / 1024).toFixed(1)} KB`;
  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
}
