'use strict';

const publicDemoAccessMode = 'demo';

function parseEnabledFlag(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  if (!normalizedValue) return false;
  if (normalizedValue === 'true') return true;
  if (normalizedValue === 'false') return false;

  throw new Error('PUBLIC_DEMO_ENABLED must be either true or false.');
}

function parsePositiveInteger(value, variableName, { required = false } = {}) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue && !required) return null;
  if (!/^[1-9]\d*$/.test(normalizedValue)) {
    throw new Error(`${variableName} must be a positive integer.`);
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isSafeInteger(parsedValue)) {
    throw new Error(`${variableName} must be a safe positive integer.`);
  }
  return parsedValue;
}

function parseRateLimit(value, variableName, defaultValue) {
  if (String(value || '').trim() === '') return defaultValue;
  return parsePositiveInteger(value, variableName, { required: true });
}

function getPublicDemoConfig(environment = process.env) {
  const enabled = parseEnabledFlag(environment.PUBLIC_DEMO_ENABLED);

  return Object.freeze({
    enabled,
    teacherId: parsePositiveInteger(
      environment.DEMO_TEACHER_ID,
      'DEMO_TEACHER_ID',
      { required: enabled }
    ),
    parentId: parsePositiveInteger(
      environment.DEMO_PARENT_ID,
      'DEMO_PARENT_ID',
      { required: enabled }
    ),
    loginRateLimit: Object.freeze({
      windowMs: parseRateLimit(
        environment.PUBLIC_DEMO_LOGIN_RATE_LIMIT_WINDOW_MS,
        'PUBLIC_DEMO_LOGIN_RATE_LIMIT_WINDOW_MS',
        60 * 1000
      ),
      maximumRequests: parseRateLimit(
        environment.PUBLIC_DEMO_LOGIN_RATE_LIMIT_MAX,
        'PUBLIC_DEMO_LOGIN_RATE_LIMIT_MAX',
        30
      ),
    }),
    aiRateLimit: Object.freeze({
      windowMs: parseRateLimit(
        environment.PUBLIC_DEMO_AI_RATE_LIMIT_WINDOW_MS,
        'PUBLIC_DEMO_AI_RATE_LIMIT_WINDOW_MS',
        10 * 60 * 1000
      ),
      maximumRequests: parseRateLimit(
        environment.PUBLIC_DEMO_AI_RATE_LIMIT_MAX,
        'PUBLIC_DEMO_AI_RATE_LIMIT_MAX',
        5
      ),
    }),
  });
}

function isConfiguredDemoIdentity({
  role,
  teacherId,
  userId,
  environment = process.env,
}) {
  const config = getPublicDemoConfig(environment);
  if (!config.enabled) return false;

  if (role === 'teacher') {
    return Number(teacherId) === config.teacherId;
  }
  if (role === 'parent') {
    return Number(userId) === config.parentId;
  }
  return false;
}

module.exports = {
  getPublicDemoConfig,
  isConfiguredDemoIdentity,
  parseEnabledFlag,
  parsePositiveInteger,
  publicDemoAccessMode,
};
