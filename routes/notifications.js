const express = require('express');
const router = express.Router();

const NotificationController = require('../controller/notification')

// GET /api/v1/users/profile/
router.get('/all', NotificationController.getNotificationsById);

module.exports = router;