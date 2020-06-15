const express = require('express');
const router = express.Router();
const QuestionController = require('../controller/question')



// GET /api/v1/users/profile/
router.get('', QuestionController.getQuestion);

// GET /api/v1/users/profile/
router.get('/:id', QuestionController.getQuestionById);

// POST /api/v1/users/create
router.post('/create', QuestionController.createQuiz);

// PATCH /api/v1/users/id
router.patch('/:id', QuestionController.updateQuestion);

router.patch('/:id/answers', QuestionController.handleAnswers);

router.delete('/:id', QuestionController.deleteQuestion);

/*
router.patch('/add-to/:id', QuizController.addQuizToActivity)

router.patch('/remove-from/:id', QuizController.removeQuizFromActivity)

*/

module.exports = router;