const express = require('express');
const router  = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { getMessages, sendMessage, getUnreadCount, deleteMessage } = require('../controllers/messageController');

router.use(protect);
router.get('/:eventId',               getMessages);
router.post('/:eventId',              sendMessage);
router.get('/:eventId/unread-count',  getUnreadCount);
router.delete('/:id',                 deleteMessage);

module.exports = router;
