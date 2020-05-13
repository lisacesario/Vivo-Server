const express = require('express');
const router = express.Router();
const StepController = require('../controller/step')



// GET /api/v1/users/profile/
router.get('', StepController.getStep);

// GET /api/v1/users/profile/
router.get('/:id', StepController.getStepById);

// POST /api/v1/users/create
router.post('/create', StepController.createStep);

// PATCH /api/v1/users/id
router.patch('/:id', StepController.updateStep);

router.delete('/:id', StepController.deleteStep);

router.patch('/add-to/:id', StepController.addStepToActivity)
router.patch('/changes/:id', StepController.changeOrder)
router.patch('/remove-from/:id', StepController.removeToolFromActivity)



module.exports = router;