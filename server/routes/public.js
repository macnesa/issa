const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { userAuth } = require('../middlewares/authentication');

router.use(userAuth);
router.get('/classmate', publicController.allStudent);
router.get('/detail', publicController.studentById);
router.get('/schedule', publicController.schedules);
router.get('/activity', publicController.allActivities);

module.exports = router;
