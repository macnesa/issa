const express = require('express');
const AssignmentController = require('../controllers/assignmentController');
const router = express.Router();

router.get('/', AssignmentController.allAssignment);

module.exports = router;