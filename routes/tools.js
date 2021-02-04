const express = require('express');
const router = express.Router();
const ToolController = require('../controller/tools')



router.get('', ToolController.getTools);

router.get('/:id', ToolController.getToolsById);

router.post('/create', ToolController.createTool);


router.patch('/:id', ToolController.updateTool);

router.delete('/:id', ToolController.deleteTool);

router.patch('/add-to/:id', ToolController.addToolToActivity)

router.patch('/remove-from/:id', ToolController.removeToolFromActivity)





module.exports = router;