const express = require('express');
const router = express.Router();
const UserController = require('../controller/users')
const EventController = require('../controller/events')



router.get('/profile/less/:id', UserController.getUsersProfile);

router.get('/profile/agenda/:id', UserController.populateAgenda)

router.get('/profile/populated/:id', UserController.populateUser);

router.get('/profile/:id', UserController.getUserProfileById);

router.post('/create', UserController.createUser);


router.patch('/requests/:id', UserController.updateUserInfo)
router.patch('/complete-activity', UserController.completeActivity);
router.patch('/:id', UserController.patchUser)



router.post('/:id/events/new', EventController.createEvent)
router.patch('/events/complete/:id', EventController.completeEvent)
router.delete('/events/:id/delete', EventController.deleteEvent)
router.get('/events/:id', EventController.getEventById)

router.patch('/social/:id', UserController.UpdateSocialNetwork)

router.patch(`/friends-of/:id/permission`, UserController.permissionSettings)

router.get('/achievements/:id', UserController.getAchievementById);
router.get('/level/:id', UserController.getLevelById);



router.get('/:id', UserController.getUser);


  



module.exports = router;