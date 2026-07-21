const express = require('express');
const HistoryController = require('../controllers/historyController');
const router = express.Router();

router.get('/', HistoryController.allHistories);


module.exports = router;