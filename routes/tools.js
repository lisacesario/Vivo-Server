const express = require('express');
const router = express.Router();
const ToolController = require('../controller/tools')



// GET /api/v1/users/profile/
router.get('', ToolController.getTools);

// GET /api/v1/users/profile/
router.get('/:id', ToolController.getToolsById);

// POST /api/v1/users/create
router.post('/create', ToolController.createTool);


// PATCH /api/v1/users/id
router.patch('/:id', ToolController.updateTool);

router.delete('/:id', ToolController.deleteTool);

router.patch('/add-to/:id', ToolController.addToolToActivity)

router.patch('/remove-from/:id', ToolController.removeToolFromActivity)





module.exports = router;