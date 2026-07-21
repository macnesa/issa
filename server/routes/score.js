const express = require('express');
const ScoreController = require('../controllers/scoreController');
const router = express.Router();


router.post('/', ScoreController.addScore);
router.put('/', ScoreController.editScore);

module.exports = router;
