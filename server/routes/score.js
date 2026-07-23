const express = require('express');
const ScoreController = require('../controllers/scoreController');
const router = express.Router();


router.post('/', ScoreController.createStudentScore);
router.put('/', ScoreController.updateStudentScore);

module.exports = router;
