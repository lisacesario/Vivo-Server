const express = require('express');
const router = express.Router();
const StepController = require('../controller/step')



router.get('', StepController.getStep);

router.get('/:id', StepController.getStepById);

router.post('/create', StepController.createStep);

router.patch('/:id', StepController.updateStep);

router.delete('/:id', StepController.deleteStep);

router.patch('/add-to/:id', StepController.addStepToActivity)
router.patch('/changes/:id', StepController.changeOrder)
router.patch('/remove-from/:id', StepController.removeStepFromActivity)



module.exports = router;