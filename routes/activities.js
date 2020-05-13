const express = require('express');
const router = express.Router();
const ActivityController = require('../controller/activities')



// GET /api/v1/users/profile/
router.get('', ActivityController.getActivity);

// GET /api/v1/users/profile/
router.get('/:id', ActivityController.getActivityByID);

// POST /api/v1/users/create
router.post('/create', ActivityController.createActivity);

// PATCH /api/v1/users/id
router.patch('/:id', ActivityController.updateActivity);

router.delete('/:id', ActivityController.deleteActivity);

module.exports = router;