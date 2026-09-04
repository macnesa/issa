export function parseScoreInput(value) {
  if (value === null || value === undefined) return null;
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized === "") return null;
  const score = Number(normalized);
  if (!Number.isInteger(score) || score < 0 || score > 100) return null;
  return score;
}
