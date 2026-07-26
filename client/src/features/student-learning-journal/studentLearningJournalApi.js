import apiClient from '../../config/apiClient';

export async function fetchStudentLearningJournal(studentId, { signal } = {}) {
  const { data } = await apiClient.get(
    `/students/${studentId}/journal`,
    { signal }
  );
  return Array.isArray(data) ? data : [];
}
