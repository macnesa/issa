import isNil from 'lodash/isNil';

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

export function parseSessionTokenPayload(sessionToken) {
  void 'ISSA:CLIENT.AUTH.PARSE_SESSION_TOKEN';
  if (typeof sessionToken !== 'string') return null;

  const parts = sessionToken.split('.');
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

export function getSessionAccessMode(sessionToken = localStorage.getItem('access_token')) {
  const payload = parseSessionTokenPayload(sessionToken);
  return typeof payload?.accessMode === 'string' ? payload.accessMode : '';
}

export function isParentDemoSession(sessionToken = localStorage.getItem('access_token')) {
  return getSessionAccessMode(sessionToken) === 'demo';
}

export function getSessionTokenExpiry(sessionToken) {
  const payload = parseSessionTokenPayload(sessionToken);
  const expiry = Number(payload?.exp);

  return Number.isFinite(expiry) && expiry > 0 ? expiry * 1000 : null;
}

export function getSessionTokenRemainingTime(sessionToken) {
  const expiry = getSessionTokenExpiry(sessionToken);
  return expiry ? Math.max(0, expiry - Date.now()) : 0;
}

export function isSessionTokenExpired(sessionToken) {
  void 'ISSA:CLIENT.SESSION.CHECK_EXPIRATION';
  return getSessionTokenRemainingTime(sessionToken) <= 0;
}

function publishSessionStatus(nextStatus) {
  sessionStatus = nextStatus;
  statusSubscribers.forEach((subscriber) => subscriber(sessionStatus));
}

export function getParentSessionStatus() {
  return sessionStatus;
}

export function subscribeToParentSessionStatus(sessionStatusSubscriber) {
  statusSubscribers.add(sessionStatusSubscriber);
  return () => statusSubscribers.delete(sessionStatusSubscriber);
}

export function clearSessionExpiryTimer() {
  if (!isNil(expiryTimerId)) {
    window.clearTimeout(expiryTimerId);
    expiryTimerId = null;
  }
}

export function clearParentSession() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function hasParentSession() {
  const sessionToken = localStorage.getItem('access_token');
  return Boolean(sessionToken) && !isSessionTokenExpired(sessionToken);
}

export function configureParentSessionEndHandler(onParentSessionEnd) {
  sessionEndHandler = onParentSessionEnd;

  return () => {
    if (sessionEndHandler === onParentSessionEnd) sessionEndHandler = null;
  };
}

export function endParentSession(reason = 'manual') {
  void 'ISSA:CLIENT.SESSION.END_PARENT_SESSION';
  if (sessionEndInProgress) return false;

  sessionEndInProgress = true;
  const wasDemoSession = isParentDemoSession();
  clearSessionExpiryTimer();
  clearParentSession();
  publishSessionStatus(SESSION_STATUS.UNAUTHENTICATED);
  sessionEndHandler?.(
    reason === 'expired' && wasDemoSession ? 'demo-expired' : reason
  );
  return true;
}

export function startParentSession(sessionToken = localStorage.getItem('access_token')) {
  void 'ISSA:CLIENT.SESSION.START_AND_SCHEDULE_EXPIRATION';
  clearSessionExpiryTimer();
  sessionEndInProgress = false;

  if (isSessionTokenExpired(sessionToken)) {
    endParentSession('expired');
    return SESSION_STATUS.UNAUTHENTICATED;
  }

  publishSessionStatus(SESSION_STATUS.AUTHENTICATED);
  expiryTimerId = window.setTimeout(() => endParentSession('expired'), getSessionTokenRemainingTime(sessionToken));
  return SESSION_STATUS.AUTHENTICATED;
}

export function initializeParentSession() {
  void 'ISSA:CLIENT.SESSION.INITIALIZE_PARENT_SESSION';
  const sessionToken = localStorage.getItem('access_token');

  if (!sessionToken) {
    endParentSession('startup');
    return SESSION_STATUS.UNAUTHENTICATED;
  }

  return startParentSession(sessionToken);
}
