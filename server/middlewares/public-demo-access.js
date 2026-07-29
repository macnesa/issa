const { verifyAuthenticationToken } = require('../helpers');
const {
  isConfiguredDemoIdentity,
  publicDemoAccessMode,
} = require('../config/public-demo');

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const aiNarrativeDraftPath =
  /^\/students\/[1-9]\d*\/ai\/narrative-draft\/?$/;

function isAiNarrativeDraftRequest(req) {
  return (
    String(req.method || '').toUpperCase() === 'POST' &&
    aiNarrativeDraftPath.test(req.path)
  );
}

function tokenRepresentsDemoAccess(
  authenticationTokenPayload,
  environment = process.env
) {
  if (!authenticationTokenPayload) return false;
  const configuredDemoIdentity = isConfiguredDemoIdentity({
    role: authenticationTokenPayload.role,
    teacherId: authenticationTokenPayload.teacherId,
    userId: authenticationTokenPayload.userId,
    environment,
  });

  return (
    authenticationTokenPayload.accessMode === publicDemoAccessMode ||
    configuredDemoIdentity
  );
}

function createPublicDemoAccessGuard({
  environment = process.env,
  verifyToken = verifyAuthenticationToken,
} = {}) {
  return function enforcePublicDemoReadOnly(req, res, next) {
    if (readOnlyMethods.has(String(req.method || '').toUpperCase())) {
      return next();
    }

    const authenticationToken = req.headers?.access_token;
    if (!authenticationToken) return next();

    let authenticationTokenPayload;
    try {
      authenticationTokenPayload = verifyToken(authenticationToken);
    } catch (error) {
      // The route's normal authentication middleware owns invalid-token errors.
      return next();
    }

    if (
      !tokenRepresentsDemoAccess(authenticationTokenPayload, environment) ||
      isAiNarrativeDraftRequest(req)
    ) {
      return next();
    }

    return next({ name: 'publicDemoReadOnly' });
  };
}

function requireWritableAccount(req, res, next) {
  if (req.user?.accessMode === publicDemoAccessMode || req.user?.isDemo) {
    return next({ name: 'publicDemoReadOnly' });
  }
  return next();
}

module.exports = {
  createPublicDemoAccessGuard,
  isAiNarrativeDraftRequest,
  requireWritableAccount,
  tokenRepresentsDemoAccess,
};
