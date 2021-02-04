const express = require('express');
const router = express.Router();

const MessagesController = require('../controller/messages')


router.get('/conversations', MessagesController.getUserConversations);

router.get('/conversations/:id', MessagesController.getConversationById);

router.post('/conversations/create', MessagesController.createConversation);

router.post('/conversations/:id/message/create', MessagesController.createMessage);



module.exports = router;