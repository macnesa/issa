const express = require('express');
const parentController = require('./parent.controller');
const { getPublicDemoConfig } = require('../../config/public-demo');
const {
  createFixedWindowRateLimiter,
} = require('../../middlewares/rate-limit');

const router = express.Router();
const { loginRateLimit } = getPublicDemoConfig();
const publicDemoLoginRateLimiter = createFixedWindowRateLimiter({
  ...loginRateLimit,
  applies: () => getPublicDemoConfig().enabled,
});

router.post(
  '/demo-login',
  publicDemoLoginRateLimiter,
  parentController.authenticatePublicDemoParent
);

router.post(
  '/login',
  parentController.authenticateParent
);

module.exports = router;
