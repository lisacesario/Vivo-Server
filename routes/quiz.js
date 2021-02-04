const express = require('express');
const router = express.Router();
const QuizController = require('../controller/quiz')



router.get('', QuizController.getQuiz);

router.get('/:id', QuizController.getQuizById);

router.post('/create', QuizController.createQuiz);

router.patch('/:id', QuizController.updateQuiz);

router.delete('/:id', QuizController.deleteQuiz);

router.patch('/add-to/:id', QuizController.addQuizToActivity)

router.patch('/remove-from/:id', QuizController.removeQuizFromActivity)



module.exports = router;