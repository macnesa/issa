const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/teacherController');
const { authenticateTeacherRequest } = require('../middlewares/authentication');

router.post('/login', TeacherController.authenticateTeacher);
router.get('/', authenticateTeacherRequest, TeacherController.getTeacherList);

module.exports = router;
