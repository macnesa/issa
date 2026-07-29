export const evidenceCategoryLabels = {
  work: 'Karya',
  assignment: 'Tugas',
  assessment: 'Penilaian',
  activity: 'Aktivitas',
  documentation: 'Dokumentasi',
};

const observedDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatEvidenceObservedDate(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Tanggal tidak tersedia';
  }

  const observedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(observedDate.getTime())
    ? 'Tanggal tidak tersedia'
    : observedDateFormatter.format(observedDate);
}
