const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const teacherController = require('./teacher.controller');
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
  teacherController.authenticatePublicDemoTeacher
);

router.post(
  '/login',
  teacherController.authenticateTeacher
);

router.get(
  '/',
  authenticateTeacherRequest,
  teacherController.getTeacherList
);

module.exports = router;
