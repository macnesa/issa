export const journalEntryTypes = {
  observation: {
    label: "Observasi",
    helper: "Catat sesuatu yang benar-benar terlihat atau terdengar. Hindari diagnosis atau label terhadap siswa.",
    tone: "observation",
  },
  strength: {
    label: "Kekuatan yang terlihat",
    helper: "Catat kemampuan, strategi, atau kualitas yang terlihat dalam proses belajar.",
    tone: "strength",
  },
  challenge: {
    label: "Hal yang sedang sulit",
    helper: "Catat bagian pembelajaran yang sedang membutuhkan dukungan. Hindari menyebutnya sebagai kelemahan siswa.",
    tone: "challenge",
  },
  milestone: {
    label: "Momen perkembangan",
    helper: "Catat momen perkembangan atau perubahan yang bermakna.",
    tone: "milestone",
  },
  student_reflection: {
    label: "Refleksi siswa",
    helper: "Catat ucapan atau refleksi siswa sedekat mungkin dengan yang disampaikan.",
    tone: "reflection",
  },
  support_note: {
    label: "Dukungan yang dicoba",
    helper: "Catat dukungan yang dicoba dan respons yang terlihat.",
    tone: "support",
  },
};

export const journalEntryTypeOptions = Object.entries(journalEntryTypes).map(
  ([value, metadata]) => ({
    value,
    label: metadata.label,
    tone: metadata.tone,
  })
);

export const journalVoiceCaptureTypes = {
  direct_quote: {
    label: "Kutipan langsung",
    helper: "Gunakan kata-kata siswa sedekat mungkin dengan ucapan aslinya.",
  },
  paraphrased: {
    label: "Dirangkum oleh guru",
    helper: "Jelaskan bahwa isi ini merupakan rangkuman guru atas refleksi siswa.",
  },
};

export const journalVoiceCaptureOptions = Object.entries(
  journalVoiceCaptureTypes
).map(([value, metadata]) => ({
  value,
  label: metadata.label,
}));

export const maximumJournalContentLength = 1500;

export function journalDateValue(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || "";
}

export function formatJournalDate(value, unavailable = "Tanggal tidak tersedia") {
  const dateValue = journalDateValue(value);
  if (!dateValue) return unavailable;

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() + 1 !== month
    || date.getDate() !== day
  ) {
    return unavailable;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
