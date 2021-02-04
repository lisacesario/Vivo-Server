const express = require('express');
const router = express.Router();

const NotificationController = require('../controller/notification')

router.get('/all', NotificationController.getNotificationsById);
router.patch('/:id', NotificationController.markNotificationAsRead);
router.delete('/:id', NotificationController.deleteNotificationById);

module.exports = router;