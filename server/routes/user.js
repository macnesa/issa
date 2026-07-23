const express = require('express');
const UserController = require('../controllers/userController');
const router = express.Router();

router.post('/login', UserController.authenticateParent);

module.exports = router;
