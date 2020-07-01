const express = require('express');
const router = express.Router();

const GroupController = require('../controller/group')


// GET /api/v1/users/profile/
router.get('/:id', GroupController.getGroupById);

// POST /api/v1/users/create
router.post('/create', GroupController.createGroup);

router.delete('/:id', GroupController.deleteGroup);

router.patch('/add-to/:id', GroupController.addPersonToGroup)
router.patch('/remove-from/:id', GroupController.removePersonToGroup)



module.exports = router;