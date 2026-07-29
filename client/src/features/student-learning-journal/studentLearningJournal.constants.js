export const journalEntryTypes = {
  observation: {
    label: 'Observasi guru',
    tone: 'observation',
  },
  strength: {
    label: 'Kekuatan yang terlihat',
    tone: 'strength',
  },
  challenge: {
    label: 'Hal yang sedang membutuhkan dukungan',
    tone: 'challenge',
  },
  milestone: {
    label: 'Momen perkembangan',
    tone: 'milestone',
  },
  student_reflection: {
    label: 'Refleksi siswa',
    tone: 'reflection',
  },
  support_note: {
    label: 'Dukungan yang dicoba',
    tone: 'support',
  },
};

export const journalVoiceCaptureTypes = {
  direct_quote: {
    label: 'Kutipan langsung',
    presentation: 'quote',
  },
  paraphrased: {
    label: 'Dirangkum oleh guru',
    presentation: 'summary',
  },
};

const journalDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatJournalObservedDate(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Tanggal tidak tersedia';
  }

  const observedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(observedDate.getTime())
    ? 'Tanggal tidak tersedia'
    : journalDateFormatter.format(observedDate);
}
