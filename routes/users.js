const express = require('express');
const router = express.Router();
const UserController = require('../controller/users')
const EventController = require('../controller/events')

// POST /api/v1/users/auth
/*
router.post('/auth', UserController.auth );

// POST /api/v1/users/register
router.post('/register', UserController.register);


*/


// GET /api/v1/users/profile/
router.get('/profile/less/:id', UserController.getUsersProfile);

// GET /api/v1/users/profile/
router.get('/profile/:id', UserController.getUserProfileById);

// POST /api/v1/users/create
router.post('/create', UserController.createUser);


// PATCH /api/v1/users/id
router.patch('/:id', UserController.patchUser);



router.post('/:id/events/new', EventController.createEvent)
router.patch('/:id/events/update', EventController.updateEvent)
router.delete('/events/:id/delete', EventController.deleteEvent)
router.get('/events/:id', EventController.getEventById)

//router.post('/:id/agenda/add-to', UserController.addEventToAgenda);
//router.patch('/:id/agenda/update', UserController.addEventToAgenda);
//router.patch('/:id/agenda/remove-from', UserController.addEventToAgenda);



//router.patch('/:id/gamification/character', UserController.addEventToAgenda);


// PATCH /api/v1/users/friends-of/id
router.patch('/friends-of/:id', UserController.sendingFriendshipRequest);

// PATCH /api/v1/users/friends-of/id/accept
router.patch(`/friends-of/:id/accept`, UserController.acceptRequest)

// PATCH /api/v1/users/friends-of/id/refuse
router.patch(`/friends-of/:id/refuse`, UserController.refuseRequest)

// PATCH /api/v1/users/friends-of/id/permission
router.patch(`/friends-of/:id/permission`, UserController.permissionSettings)



router.patch('/teacher-of/:id', UserController.sendBeMyTeacherRequest);
router.patch('/teacher-of/:id/accept', UserController.acceptBeMyTeacherRequest);
router.patch('/teacher-of/:id/refuse', UserController.refuseBeMyTeacherRequest);

router.patch('/student-of/:id', UserController.sendBeMyStudentRequest);
router.patch('/student-of/:id/accept', UserController.acceptBeMyStudentRequest);
router.patch('/student-of/:id/refuse', UserController.refuseBeMyStudentRequest);


// GAMIFICATION STUFF
router.get('/achievements/:id', UserController.getAchievementById);
router.get('/level/:id', UserController.getLevelById);
router.patch('/complete-activity/:id', UserController.completeActivity);



// GET /api/v1/users/id
router.get('/:id', UserController.getUser);


  



module.exports = router;