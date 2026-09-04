import { useEffect, useState } from 'react';
import apiClient from '../../config/apiClient';
import { fetchStudentLearningJournal } from '../student-learning-journal/studentLearningJournalApi';
import { fetchStudentEvidences } from '../student-evidence/studentEvidenceApi';

export function requireHistoryArray(data) {
  if (!Array.isArray(data)) throw new Error('Format riwayat tidak tersedia.');
  return data;
}

const empty = () => ({ status: 'loading', data: [] });

export default function useJourneyHistory(studentId, refreshKey) {
  const [history, setHistory] = useState(() => ({ studentId, journal: empty(), evidence: empty(), feedback: empty() }));
  useEffect(() => {
    if (!studentId) return undefined;
    const controller = new AbortController();
    setHistory((current) => ({
      studentId,
      ...Object.fromEntries(['journal', 'evidence', 'feedback'].map((key) => [key, {
        status: 'loading', data: current.studentId === studentId ? current[key].data : [],
      }])),
    }));
    // Commit one coherent refresh. Aborted generations may never resurrect
    // stale media or an old student's records after a newer request completes.
    Promise.allSettled([
      fetchStudentLearningJournal(studentId, { signal: controller.signal }),
      fetchStudentEvidences(studentId, { signal: controller.signal }),
      apiClient.get(`/students/${studentId}/feedbacks`, { signal: controller.signal })
        .then(({ data }) => requireHistoryArray(data)),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      setHistory({ studentId, ...Object.fromEntries(results.map((result, index) => [
        ['journal', 'evidence', 'feedback'][index],
        result.status === 'fulfilled'
          ? { status: 'success', data: result.value }
          : { status: 'error', data: [] },
      ])) });
    });
    return () => controller.abort();
  }, [studentId, refreshKey]);
  return history.studentId === studentId ? history : { journal: empty(), evidence: empty(), feedback: empty() };
}
