import apiClient from '../../config/apiClient';

export async function fetchStudentEvidences(studentId, { signal } = {}) {
  const { data } = await apiClient.get(
    `/students/${studentId}/evidences`,
    { signal }
  );
  if (!Array.isArray(data)) throw new Error('Dokumentasi belum dapat dimuat.');
  return data;
}
