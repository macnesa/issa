export const SESSION_EXPIRED_EVENT = 'issa:parent-session-expired';

export function hasParentSession() {
  return Boolean(localStorage.getItem('access_token'));
}

export function clearParentSession() {
  ['access_token', 'userId', 'teacherId', 'id'].forEach((key) => localStorage.removeItem(key));
}
