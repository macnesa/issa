// A school calendar day is not a UTC timestamp. Keep date-only values on the
// same local calendar day, including when the parent's device is abroad.
export function parseParentDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date : new Date(NaN);
  }
  return value ? new Date(value) : new Date(NaN);
}
