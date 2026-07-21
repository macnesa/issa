const express = require('express');
const TransactionController = require('../controllers/transactionController');
const router = express.Router();

router.get('/', TransactionController.allTransactions);

module.exports = router;
