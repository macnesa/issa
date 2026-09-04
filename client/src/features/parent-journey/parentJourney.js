import { parseParentDate } from '../../utils/parentDates';
import { journalEntryTypes } from '../student-learning-journal/studentLearningJournal.constants';

const toTimestamp = (value) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = parseParentDate(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

export function formatParentDate(value, fallback = 'Tanggal belum tersedia') {
  if (!value) return fallback;
  const date = parseParentDate(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function buildJourneyEvents({ attendance = [], scores = [], journal = [], evidences = [], feedback = [], evidenceLoaded = false }) {
  const evidenceById = new Map(evidences.map((item) => [String(item.id), item]));
  const journalEvidence = (entry) => {
    if (!entry.evidence || entry.evidence.availability === 'retracted') return entry.evidence;
    return evidenceById.get(String(entry.evidence.id))
      || (evidenceLoaded ? { ...entry.evidence, file: null } : entry.evidence);
  };
  const linkedEvidenceIds = new Set(
    journal
      .map((entry) => entry?.evidence?.id)
      .filter((value) => value !== null && value !== undefined)
      .map(String),
  );

  const events = [
    ...attendance.filter((record) => record.status && record.status !== 'Hadir').map((record) => ({
      id: `attendance-${record.id ?? record.createdAt}`,
      type: 'attendance',
      occurredAt: record.createdAt,
      title: `Kehadiran · ${record.status || 'Belum tercatat'}`,
      detail: 'Status kehadiran yang tercatat pada hari tersebut.',
      raw: record,
    })),
    ...scores.filter((record) => record.value !== null && record.value !== undefined && record.value !== '').map((record) => ({
      id: `score-${record.id ?? record.recordedAt}`,
      type: 'assessment',
      occurredAt: record.recordedAt,
      title: record.lesson?.name || 'Penilaian',
      detail: record.assignment?.description || 'Penilaian dari sekolah',
      value: record.value,
      lessonId: record.lessonId ?? record.lesson?.id ?? null,
      raw: record,
    })),
    ...journal.map((entry) => ({
      id: `journal-${entry.id}`,
      type: 'journal',
      occurredAt: entry.observedAt,
      title: entry.type === 'student_reflection' ? 'Suara anak' : journalEntryTypes[entry.type]?.label || 'Catatan guru',
      detail: entry.content || '',
      teacherName: entry.teacher?.name || '',
      evidence: journalEvidence(entry) || null,
      voiceCaptureType: entry.voiceCaptureType,
      wasEdited: entry.wasEdited,
      raw: entry,
    })),
    ...evidences
      .filter((evidence) => evidence.availability !== 'retracted' && !linkedEvidenceIds.has(String(evidence.id)))
      .map((evidence) => ({
        id: `evidence-${evidence.id}`,
        type: 'evidence',
        occurredAt: evidence.observedAt,
        title: evidence.title || 'Bukti belajar',
        detail: evidence.description || '',
        evidence,
        raw: evidence,
      })),
    ...feedback.map((change) => ({
      id: `feedback-${change.id}`,
      type: 'feedback',
      occurredAt: change.observedAt,
      title: 'Catatan guru',
      detail: change.content || '',
      teacherName: change.Teacher?.name || change.teacher?.name || '',
      raw: change,
    })),
  ];

  return Array.from(new Map(events.map((event) => [event.id, event])).values()).sort((left, right) => {
    const dateDifference = toTimestamp(right.occurredAt) - toTimestamp(left.occurredAt);
    return dateDifference || String(left.id).localeCompare(String(right.id), 'id');
  });
}

export function getLatestScore(scores = []) {
  return scores
    .filter((score) => score?.value !== null && score?.value !== undefined && score?.value !== '')
    .slice()
    .sort((left, right) => toTimestamp(right.recordedAt) - toTimestamp(left.recordedAt))[0] || null;
}
