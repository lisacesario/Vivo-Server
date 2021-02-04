const express = require('express');
const router = express.Router();
const ActivityController = require('../controller/activities')

const gamification = require('../controller/gamification')

router.get('', ActivityController.getActivity);

router.get('/:id', ActivityController.getActivityByID);

router.get('/populated/:id', ActivityController.getPopulatedActivity);

router.post('/create', ActivityController.createActivity);

router.patch('/:id', ActivityController.updateActivity);

router.delete('/:id', ActivityController.deleteActivity);

module.exports = router;