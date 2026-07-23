const express = require('express');
const parentController = require('./parent.controller');

const router = express.Router();

router.post(
  '/login',
  parentController.authenticateParent
);

module.exports = router;
