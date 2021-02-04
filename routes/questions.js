const express = require('express');
const router = express.Router();
const QuestionController = require('../controller/question')




router.get('', QuestionController.getQuestion);

router.get('/:id', QuestionController.getQuestionById);

router.post('/create', QuestionController.createQuiz);

router.patch('/:id', QuestionController.updateQuestion);

router.patch('/:id/answers', QuestionController.handleAnswers);

router.delete('/:id', QuestionController.deleteQuestion);


router.patch('/add-to/:id', QuestionController.addQuestionToActivity)

router.patch('/remove-from/:id', QuestionController.removeQuestionFromActivity)



module.exports = router;