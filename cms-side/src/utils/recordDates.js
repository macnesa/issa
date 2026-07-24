export function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return undefined;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return localDateValue(date) === value ? date : undefined;
}

export function formatDateDisplay(value) {
  const date = parseLocalDateValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function parseLocalDateTimeValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (
    localDateValue(date) !== `${year}-${month}-${day}`
    || String(date.getHours()).padStart(2, "0") !== hour
    || String(date.getMinutes()).padStart(2, "0") !== minute
  ) return undefined;

  return { date, hour, minute };
}

export function localDateTimeValue(date, hour, minute) {
  return `${localDateValue(date)}T${hour}:${minute}`;
}

export function formatDateTimeDisplay(value) {
  const parsedValue = parseLocalDateTimeValue(value);
  if (!parsedValue) return "";
  return `${formatDateDisplay(localDateValue(parsedValue.date))} · ${parsedValue.hour}:${parsedValue.minute}`;
}

export function formatRecordedDate(value, unavailable = "Tanggal pencatatan belum tersedia") {
  if (!value) return unavailable;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return unavailable;
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function toIsoDateTime(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
