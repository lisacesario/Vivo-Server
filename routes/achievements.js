const express = require('express');
const router = express.Router();
const AchievementController = require('../controller/achievements')


router.get('', AchievementController.getAchievements);

module.exports = router;