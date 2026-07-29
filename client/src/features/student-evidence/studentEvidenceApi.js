import apiClient from '../../config/apiClient';

export async function fetchStudentEvidences(studentId, { signal } = {}) {
  const { data } = await apiClient.get(
    `/students/${studentId}/evidences`,
    { signal }
  );
  return Array.isArray(data) ? data : [];
}
