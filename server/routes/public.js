const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { authenticateParentRequest } = require('../middlewares/authentication');

router.use(authenticateParentRequest);
router.get('/classmate', publicController.getClassmates);
router.get('/detail', publicController.getPublicStudentDetail);
router.get('/schedule', publicController.getPublicClassSchedule);
router.get('/activity', publicController.getSchoolActivities);

module.exports = router;
