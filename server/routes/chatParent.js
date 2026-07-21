const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
// const { teacherAuth, userAuth } = require('../middlewares/authentication');

router.post('/', chatController.postMessage);
router.get('/:toId', chatController.getAllUserRelatedToSender);
router.get('/:from/:to', chatController.getMessageHistory);

module.exports = router;
