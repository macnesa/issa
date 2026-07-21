const express = require('express');
const router = express.Router();
const publicController = require("../controllers/publicController");

const { userAuth } = require('../middlewares/authentication');

// student n parent authentication
router.use(userAuth);

router.get('/classmate', publicController.allStudent);
router.get('/detail', publicController.studentById);
router.get('/lesson', publicController.studentlessondetail);
router.get('/schedule', publicController.schedules);
router.get('/activity', publicController.allActivities);
router.get('/transaction', publicController.transactionStatus);
router.get('/statistic', publicController.statistic);
router.patch('/transaction', publicController.successPayment);


// router.get('/activity/:id', publicController.activityById);


module.exports = router