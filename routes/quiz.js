const express = require('express');
const router = express.Router();
const QuizController = require('../controller/quiz')



// GET /api/v1/users/profile/
router.get('', QuizController.getQuiz);

// GET /api/v1/users/profile/
router.get('/:id', QuizController.getQuizById);

// POST /api/v1/users/create
router.post('/create', QuizController.createQuiz);

// PATCH /api/v1/users/id
router.patch('/:id', QuizController.updateQuiz);

router.delete('/:id', QuizController.deleteQuiz);

router.patch('/add-to/:id', QuizController.addQuizToActivity)

router.patch('/remove-from/:id', QuizController.removeQuizFromActivity)



module.exports = router;