export function getAuthorizedClassName(student, studentList) {
  const directClassName = student?.Class?.name?.trim();
  if (directClassName) return directClassName;

  const rows = Array.isArray(studentList?.rows) ? studentList.rows : [];
  const matchingStudent = rows.find(
    (row) => Number(row?.id) === Number(student?.id)
  );
  const matchingClassName = matchingStudent?.Class?.name?.trim();
  if (matchingClassName) return matchingClassName;

  return rows.find((row) => row?.Class?.name?.trim())?.Class.name.trim() || "";
}
