const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification, deleteNotificationsBulk } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
// router.get('/unread-count', protect, getUnreadCount); // Added
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/', protect, deleteNotificationsBulk);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
