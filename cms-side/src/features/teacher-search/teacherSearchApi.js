import baseUrl from "../../config/api";

export async function searchTeacherRecords(query, {
  limit = 5,
  signal,
} = {}) {
  const accessToken = localStorage.getItem("access_token");
  const searchParameters = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const response = await fetch(
    `${baseUrl}/teachers/me/search?${searchParameters.toString()}`,
    {
      headers: { access_token: accessToken },
      signal,
    }
  );
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const searchError = new Error(
      responseBody?.error?.message || "Pencarian belum dapat digunakan."
    );
    searchError.code = responseBody?.error?.code || "teacher_search_unavailable";
    searchError.status = response.status;
    throw searchError;
  }

  return responseBody?.data || {
    query,
    total: 0,
    groups: [],
  };
}
