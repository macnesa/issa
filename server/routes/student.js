const express = require('express');
const StudentController = require('../controllers/studentController');
const router = express.Router();

router.get('/', StudentController.allStudents);
router.get('/:id/feedbacks', StudentController.feedbackHistory);
router.get('/:id', StudentController.studentById);
router.post('/', StudentController.addStudent);
router.put('/:id', StudentController.editStudent);

module.exports = router;
