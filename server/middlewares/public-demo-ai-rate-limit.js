'use strict';

const { getPublicDemoConfig } = require('../config/public-demo');
const { createFixedWindowRateLimiter } = require('./rate-limit');

const PUBLIC_DEMO_AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const PUBLIC_DEMO_AI_DAILY_MAXIMUM_REQUESTS = 30;

function createPublicDemoAiRateLimiter({
  environment = process.env,
  clock,
} = {}) {
  const { aiRateLimit } = getPublicDemoConfig(environment);
  const sharedOptions = {
    key: (req) => `teacher:${req.user?.teacherId || 'unknown'}`,
    applies: (req) => req.user?.isDemo === true,
    clock,
  };
  const shortWindowRateLimiter = createFixedWindowRateLimiter({
    ...aiRateLimit,
    ...sharedOptions,
  });
  const dailyRateLimiter = createFixedWindowRateLimiter({
    windowMs: PUBLIC_DEMO_AI_DAILY_WINDOW_MS,
    maximumRequests: PUBLIC_DEMO_AI_DAILY_MAXIMUM_REQUESTS,
    ...sharedOptions,
  });

  // These counters intentionally live in this backend process. They reset on
  // restart/deploy and are a lightweight free-tier safeguard, not distributed
  // production rate limiting.
  return function publicDemoAiRateLimiter(req, res, next) {
    return shortWindowRateLimiter(req, res, (shortWindowError) => {
      if (shortWindowError) return next(shortWindowError);
      return dailyRateLimiter(req, res, next);
    });
  };
}

const publicDemoAiRateLimiter = createPublicDemoAiRateLimiter();

module.exports = {
  createPublicDemoAiRateLimiter,
  publicDemoAiRateLimiter,
};
