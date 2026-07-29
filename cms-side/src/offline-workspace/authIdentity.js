const teacherIdentityStorageKey = "issa_teacher_identity";

function decodeBase64Url(value) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4);
  return decodeURIComponent(
    atob(`${normalizedValue}${padding}`)
      .split("")
      .map((character) => (
        `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
      ))
      .join("")
  );
}

export function readTeacherIdentityFromToken(token) {
  const payload = readTeacherSessionPayload(token);
  const teacherId = Number(payload?.teacherId);
  if (payload?.role !== "teacher" || !Number.isSafeInteger(teacherId)) {
    return null;
  }
  return { id: teacherId, name: "" };
}

export function readTeacherSessionPayload(token) {
  if (typeof token !== "string") return null;
  try {
    const payload = JSON.parse(decodeBase64Url(token.split(".")[1] || ""));
    return payload && typeof payload === "object" ? payload : null;
  } catch (error) {
    return null;
  }
}

export function getTeacherAccessMode(
  token = localStorage.getItem("access_token")
) {
  const payload = readTeacherSessionPayload(token);
  return typeof payload?.accessMode === "string" ? payload.accessMode : "";
}

export function isTeacherDemoSession(
  token = localStorage.getItem("access_token")
) {
  return getTeacherAccessMode(token) === "demo";
}

export function getTeacherTokenExpiry(
  token = localStorage.getItem("access_token")
) {
  const expiry = Number(readTeacherSessionPayload(token)?.exp);
  return Number.isFinite(expiry) && expiry > 0 ? expiry * 1000 : null;
}

export function isTeacherTokenExpired(
  token = localStorage.getItem("access_token")
) {
  const expiry = getTeacherTokenExpiry(token);
  return expiry ? expiry <= Date.now() : true;
}

export function saveLastKnownTeacherIdentity(identity) {
  const teacherId = Number(identity?.id);
  if (!Number.isSafeInteger(teacherId) || teacherId < 1) {
    throw new Error("Teacher identity is invalid.");
  }
  const safeIdentity = {
    id: teacherId,
    name: typeof identity.name === "string" ? identity.name : "",
  };
  localStorage.setItem(
    teacherIdentityStorageKey,
    JSON.stringify(safeIdentity)
  );
  return safeIdentity;
}

export function getActiveTeacherIdentity() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  const tokenIdentity = readTeacherIdentityFromToken(token);

  let storedIdentity = null;
  try {
    const parsedIdentity = JSON.parse(
      localStorage.getItem(teacherIdentityStorageKey) || "null"
    );
    const storedTeacherId = Number(parsedIdentity?.id);
    if (Number.isSafeInteger(storedTeacherId) && storedTeacherId > 0) {
      storedIdentity = {
        id: storedTeacherId,
        name: typeof parsedIdentity.name === "string"
          ? parsedIdentity.name
          : "",
      };
    }
  } catch (error) {
    storedIdentity = null;
  }

  if (
    tokenIdentity
    && storedIdentity
    && tokenIdentity.id !== storedIdentity.id
  ) {
    return tokenIdentity;
  }
  return tokenIdentity
    ? {
      ...storedIdentity,
      ...tokenIdentity,
      name: storedIdentity?.name || tokenIdentity.name,
    }
    : storedIdentity;
}

export function clearLastKnownTeacherIdentity() {
  localStorage.removeItem(teacherIdentityStorageKey);
}

export { teacherIdentityStorageKey };
