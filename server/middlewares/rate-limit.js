function requestIpAddress(req) {
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

function createFixedWindowRateLimiter({
  windowMs,
  maximumRequests,
  key = requestIpAddress,
  applies = () => true,
  clock = () => Date.now(),
} = {}) {
  const requestWindows = new Map();

  return function fixedWindowRateLimiter(req, res, next) {
    if (!applies(req)) return next();

    const now = clock();
    const requestKey = String(key(req));
    const currentWindow = requestWindows.get(requestKey);
    const activeWindow = (
      currentWindow && currentWindow.resetAt > now
        ? currentWindow
        : { count: 0, resetAt: now + windowMs }
    );

    activeWindow.count += 1;
    requestWindows.set(requestKey, activeWindow);

    if (activeWindow.count <= maximumRequests) return next();

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((activeWindow.resetAt - now) / 1000)
    );
    res.set('Retry-After', String(retryAfterSeconds));
    return next({ name: 'publicDemoRateLimitExceeded' });
  };
}

module.exports = {
  createFixedWindowRateLimiter,
  requestIpAddress,
};
