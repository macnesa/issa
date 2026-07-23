export const AUTH_STORAGE_KEYS = ['access_token', 'userId', 'teacherId', 'id'];

export const SESSION_STATUS = {
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

let sessionStatus = SESSION_STATUS.CHECKING;
let expiryTimerId = null;
let sessionEndInProgress = false;
let sessionEndHandler = null;
const statusSubscribers = new Set();

function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? payload : null;
  } catch (error) {
    return null;
  }
}

export function getTokenExpiry(token) {
  const payload = decodeJwtPayload(token);
  const expiry = Number(payload?.exp);

  return Number.isFinite(expiry) && expiry > 0 ? expiry * 1000 : null;
}

export function getTokenRemainingTime(token) {
  const expiry = getTokenExpiry(token);
  return expiry ? Math.max(0, expiry - Date.now()) : 0;
}

export function isTokenExpired(token) {
  return getTokenRemainingTime(token) <= 0;
}

function publishSessionStatus(nextStatus) {
  sessionStatus = nextStatus;
  statusSubscribers.forEach((subscriber) => subscriber(sessionStatus));
}

export function getParentSessionStatus() {
  return sessionStatus;
}

export function subscribeToParentSessionStatus(subscriber) {
  statusSubscribers.add(subscriber);
  return () => statusSubscribers.delete(subscriber);
}

export function clearSessionExpiryTimer() {
  if (expiryTimerId !== null) {
    window.clearTimeout(expiryTimerId);
    expiryTimerId = null;
  }
}

export function clearParentSession() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function hasParentSession() {
  const token = localStorage.getItem('access_token');
  return Boolean(token) && !isTokenExpired(token);
}

export function configureParentSessionEndHandler(handler) {
  sessionEndHandler = handler;

  return () => {
    if (sessionEndHandler === handler) sessionEndHandler = null;
  };
}

export function endParentSession(reason = 'manual') {
  if (sessionEndInProgress) return false;

  sessionEndInProgress = true;
  clearSessionExpiryTimer();
  clearParentSession();
  publishSessionStatus(SESSION_STATUS.UNAUTHENTICATED);
  sessionEndHandler?.(reason);
  return true;
}

export function startParentSession(token = localStorage.getItem('access_token')) {
  clearSessionExpiryTimer();
  sessionEndInProgress = false;

  if (isTokenExpired(token)) {
    endParentSession('expired');
    return SESSION_STATUS.UNAUTHENTICATED;
  }

  publishSessionStatus(SESSION_STATUS.AUTHENTICATED);
  expiryTimerId = window.setTimeout(() => endParentSession('expired'), getTokenRemainingTime(token));
  return SESSION_STATUS.AUTHENTICATED;
}

export function initializeParentSession() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    endParentSession('startup');
    return SESSION_STATUS.UNAUTHENTICATED;
  }

  return startParentSession(token);
}
