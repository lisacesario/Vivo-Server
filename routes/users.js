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

router.get('/profile/agenda/:id', UserController.populateAgenda)

router.get('/profile/populated/:id', UserController.populateUser);

// GET /api/v1/users/profile/
router.get('/profile/:id', UserController.getUserProfileById);

// POST /api/v1/users/create
router.post('/create', UserController.createUser);


// PATCH /api/v1/users/id
router.patch('/requests/:id', UserController.updateUserInfo)
router.patch('/complete-activity', UserController.completeActivity);
router.patch('/:id', UserController.patchUser)



router.post('/:id/events/new', EventController.createEvent)
router.patch('/events/complete/:id', EventController.completeEvent)
//router.patch('/:id/events/update', EventController.updateEvent)
router.delete('/events/:id/delete', EventController.deleteEvent)
router.get('/events/:id', EventController.getEventById)


//router.post('/:id/agenda/add-to', UserController.addEventToAgenda);
//router.patch('/:id/agenda/update', UserController.addEventToAgenda);
//router.patch('/:id/agenda/remove-from', UserController.addEventToAgenda);



//router.patch('/:id/gamification/character', UserController.addEventToAgenda);

router.patch('/social/:id', UserController.UpdateSocialNetwork)

router.patch(`/friends-of/:id/permission`, UserController.permissionSettings)

// GAMIFICATION STUFF
router.get('/achievements/:id', UserController.getAchievementById);
router.get('/level/:id', UserController.getLevelById);



// GET /api/v1/users/id
router.get('/:id', UserController.getUser);


  



module.exports = router;