const express = require('express');
const StudentController = require('../controllers/studentController');
const router = express.Router();

router.get('/', StudentController.getStudentList);
router.get('/:id/feedbacks', StudentController.getStudentFeedbackHistory);
router.get('/:id', StudentController.getStudentDetail);
router.post('/', StudentController.createStudent);
router.put('/:id', StudentController.updateStudent);

module.exports = router;
