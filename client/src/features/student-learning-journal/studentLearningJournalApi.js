import apiClient from '../../config/apiClient';

export async function fetchStudentLearningJournal(studentId, { signal } = {}) {
  const { data } = await apiClient.get(
    `/students/${studentId}/journal`,
    { signal }
  );
  if (!Array.isArray(data)) throw new Error('Catatan belajar belum dapat dimuat.');
  return data;
}
