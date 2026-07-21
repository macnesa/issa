const express = require('express');
const TransactionController = require('../controllers/transactionController');
const UserController = require('../controllers/userController');
const router = express.Router();
const { userAuth } = require('../middlewares/authentication');

router.post('/login', UserController.login);

router.use(userAuth);
router.get('/userChild', UserController.userChild);
router.post('/generate-midtrans/:id', TransactionController.midtransToken)

module.exports = router;
