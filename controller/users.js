const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { UserProfile, TeacherProfile, LearnerProfile } = require('../models/user_profile');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');

const { BaseActivity } = require('../models/activities');
const { Event } = require('../models/events');
var async = require('async');

const {Achievement} =  require('../models/gaming/achievement');
const {Level} = require('../models/gaming/level')

const gamification = require('../controller/gamification')

const logs = require('../controller/log');

exports.createUser = function (req, res, next) {
    const { uid, email, role, photoURL, displayName } = req.body;
    const userProfile = new UserProfile({ uid, email, role, photoURL, displayName })
    UserProfile.create(userProfile, function (error, newProfile) {
        if (error) {
            return res.status(400).send(
                {
                    "action": "Create User Profile",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": error,
                        "message": "Error in create user profile"
                    },
                })
        }

        Level.findOne({'position':0}).exec()
            .then(level =>{
                    const data = {
                        "level": level,
                        "unlocked_time":Date.now()
                    }
                    newProfile.level = data
                    newProfile.save()
                    return res.status(200).send(newProfile)
                })       

    });
}

exports.getAchievementById = function(req,res,next){
    const search_id = req.params.id;
    Achievement.findById(search_id).exec()
                .then(foundAchievements =>{
                    return res.status(200).send(foundAchievements)
                })
                .catch(err =>{
                    return res.status(400).send(err)
                })

}

exports.getLevelById = function(req,res,next){
    const search_id = req.params.id;
    Level.findById(search_id).exec()
                .then(foundLevel =>{
                    return res.status(200).send(foundLevel)
                })
                .catch(err =>{
                    return res.status(400).send(err)
                })
}


exports.getUser = function (req, res, next) {
    const requestedUserId = req.params.id;
    UserProfile.findOne({ uid: requestedUserId })
        .select('-uid -email')
        .exec()
        .then(user => {
            return res.status(200).send(user)
        })
        .catch(err => {
            return res.status(400).send(
                {
                    "action": "Get User Profile",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in retrieving user profile"
                    },
                })
        })
}


exports.getUsersProfile = function (req, res, next) {
    const requestedUserId = req.params.id;
    UserProfile.find({uid:{$ne: requestedUserId}})
        .select('displayName photoURL role')
        .exec()
        .then(userProfile => {
            return res.status(200).send(userProfile)
        })
        .catch(err => {
            return res.status(400).send(
                {
                    "action": "Get Users Profiles",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err,
                        "message": "Error in retrieving users profiles"
                    }
                })
        })
}



exports.getUserProfileById = function (req, res, next) {
    const requestedUserId = req.params.id;
    UserProfile.findById(requestedUserId)
        .exec()
        .then(user => {
            return res.status(200).send(user)
        })
        .catch(err => {
            return res.status(400).send(
                {
                    "action": "Get Users Profile By ID",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err,
                        "message": "Error in retrieving user profile"
                    }
                })
        })
}


exports.populateUser = function(req,res, next){
    const requestedUserId = req.params.id;
    UserProfile.findOne({uid:requestedUserId})
                .populate({
                    path:'teachers.teacher',
                    model:'UserProfile',
                    })
                .populate({
                    path:'followers.follower',
                    model:'UserProfile',
                    })
                .populate( {
                    path:'followed.followed',
                    model:'UserProfile',
                })
                .populate({
                    path:'achievements.achievement',
                    model:'Achievement',
                })
                .populate({
                    path:'level.level',
                    model:'Level',
                })
                .populate({
                    path:'agenda',
                    model:'Event',
                })
                .exec()
                .then((user)=>{
                    return res.status(200).send(user)
                })
                .catch((err)=>{
                    return res.status(400).send(err)
                })
}


exports.getPopulatedUserProfile =  function(req,res,next){
    const requestedUserId = req.params.id;
    UserProfile.findOne({uid:requestedUserId})
                .populate({
                    path:'teachers.teacher',
                    model:'UserProfile',
                    })

                .exec()
                .then( user => {
                    UserProfile.populate(user,
                        {
                            path:'followers.follower',
                            model:'UserProfile',
                        },function(err,user){
                            if(err){
                                return res.status(400).send(err)
                            }
                            UserProfile.populate(user,
                                {
                                    path:'followed.followed',
                                    model:'UserProfile',
                                },function(err,user){
                                    if(err){
                                        return res.status(400).send(err)
                                    }
                                    return res.status(200).send(user)
                                })
                        })
                })
                .catch(err =>{
                    return res.status(400).send(err)
                })
}


exports.patchUser = function (req, res, next) {
    const user = res.locals.user;
    const data = req.body;

    headers =  req.headers
    checkIsAuthenticated(headers)
        .then(isAuth=>{
            if(isAuth === false){
                return res.status(403).send("You are not authorized")
            }
            UserProfile.findOne({uid:isAuth.uid})
                        .then(user =>{
                            user.set(data)
                            user.save(function(err, user){
                                if(err){
                                    return res.status(400).send(err)
                                }
                                else{
                                    return res.status("200").send(user)
                                }
                            })
                        })
                        .catch(err =>{
                            return res.status(400).send(
                                {
                                    "action": "Patch User Profile",
                                    "success": false,
                                    "status": 400,
                                    "error": {
                                        "code": err,
                                        "message": "Error in patch user profile"
                                    }
                                })
                        })
        })
        .catch(err =>{
            return res.status(400).send(
                {
                    "action": "Patch User Profile",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err,
                        "message": "Error in patch user profile"
                    }
                })
        })
 

}



exports.updateUserInfo = function (req, res, next) {
    const search_id = req.params.id;
    const {obj, typeOfAction} = req.body;

    if(typeOfAction == "ADD_TEACHER"){
        UserProfile.findById(search_id)
                    .then(learner =>{
                        //console.log("teacher")
                        learner.teachers.push(obj)
                        learner.save(function(err,learner){
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(400).send(learner)
                        })
                    })
                    .catch(err=>{
                        return res.send(err)
                    })
    }
    else if(typeOfAction == "ADD_LEARNER"){
        UserProfile.findById(search_id)
                    .then(teacher =>{
                        //console.log("teacher")
                        teacher.learners.push(obj)
                        teacher.save(function(err,teacher){
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(200).send(teacher)
                        })
                    })
                    .catch(err=>{
                        return res.send(err)
                    })
    }
    else{
        UserProfile.findById(search_id)
        .then(user =>{
                if(typeOfAction == "NEW_FOLLOWER"){
                    user.followers.push(obj)
                }
                else if(typeOfAction == "NEW_FOLLOWED"){
                    user.followed.push(obj)
                }
                    user.save(function(err, user){
                        if(err){
                            return res.status(400).send(err)
                        }
                        else{
                            return res.status("200").send(user)
                        }
                    })
                })
                .catch(err =>{
                    return res.send(err)
                })

    }
   

}


exports.completeActivity = function(req,res,next){

    const{activity, score, answers} = req.body;
    headers = req.headers

    checkIsAuthenticated(headers)
        .then(isAuth =>{
            if(isAuth === null){
                return res.status(403).send("NOT-AUTHORIZED")
            }
            if(isAuth === "Teacher"){
                return res.status(403).send("WRONG-ROLE")
            }
            else{
               isAuth.activities_completed.push({
                   "activity":activity,
                   "score" : score,
                   "answers":answers
               })
               isAuth.exp = isAuth.exp + 50

                  
               Promise.all([
                gamification.computeAchievement(isAuth,isAuth.activities_completed.length, "Activity"),
                gamification.computeLevelCreate(isAuth)
            ]).then(values =>{
                let achievement = values[0]
                let level = values[1]

                if(achievement !== null){
                    const obj = {
                        "unlocked_time":Date.now(),
                        "unlocked":true,
                        "achievement":achievement
                    }
                    isAuth.achievements.push(obj)
                    isAuth.exp = isAuth.exp + achievement.points
                }
                if(level !== null){
                    isAuth.level.level = level
                    isAuth.level.unlocked_time = Date.now()
                }
          
                isAuth.save(function(err,elem){

                    if(err){
                        res.status(400).send(err)
                    }
                    if(level && achievement){
                        return res.status(200).send({"data":isAuth, "achievement":achievement,"level":level})
                        
                    }
                    else if (level){
                        return res.status(200).send({"data":isAuth,"level":level})
                         

                    }
                    else if (achievement){
                        return res.status(200).send({"data":isAuth, "achievement":achievement})
                         

                    }
                    else{
                        return res.status(200).send({"data":isAuth})
                        
                    
                    }
                }) 
            })
            .catch(err=>{
                res.status(400).send(err)
            })


            }
        })
        .catch(err=>{
            res.status(400).send(err)

        })
}


exports.markAsFavouriteItem = function(req,res, next){
    const {activity} = req.body
    headers = req.headers

    checkIsAuthenticated(headers)
        .then(isAuth=>{
            if(isAuth === false){
                return res.status(403).send("NOT-AUTH")
            }
            isAuth.favourite_activities.push(activity)
            isAuth.save(function(err,elem){
                if(err){
                    return res.status(400).send(err)
                }
                return res.status(200).send("OK")
            })
        })
        .catch(err=>{
            return res.status(400).send(err)
        })
}


exports.permissionSettings = function (req, res, next) {


    const requestedUserId = req.params.id;
    const data = req.body;
    UserProfile.findOne({ uid: requestedUserId }).populate().exec(function (err, foundUser) {
        if (err) {
            return res.status(400).send(
                {
                    "action": "Change Permission Settings",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in retrieving Followed"
                    }
                })
        }
        foundUser.followers.forEach(follower => {
            if (follower.follower_id == data.follower_id) {
                follower.permission.can_write = data.permission.can_write_me;
                follower.permission.can_see_bio_info = data.permission.can_see_my_bio_info;
                follower.permission.can_see_followed_list = data.permission.can_see_my_followed_list;
                follower.permission.can_see_follower_list = data.permission.can_see_my_follower_list;
                follower.permission.can_see_agenda = data.permission.can_see_agenda;
                follower.permission.can_see_stats = data.permission.can_see_stats;
                follower.permission.can_see_achievements = data.permission.can_see_achievements;
            }
        });
        foundUser.save().then(
            (foundUser) => {
                UserProfile.findById(data.follower_id).exec(function (err, foundFollower) {
                    if (err) {
                        return res.status(400).send(
                            {
                                "action": "Change Permission Settings",
                                "success": false,
                                "status": 400,
                                "error": {
                                    "code": err.errors,
                                    "message": "Error in retrieving Follower"
                                }
                            })
                    }
                    foundFollower.followed.forEach(element => {
                        if (element.followed_id == foundUser._id) {
                            element.permission.can_write = data.permission.can_write_me;
                            element.permission.can_see_bio_info = data.permission.can_see_my_bio_info;
                            element.permission.can_see_followed_list = data.permission.can_see_my_followed_list;
                            element.permission.can_see_follower_list = data.permission.can_see_my_follower_list;
                            element.permission.can_see_agenda = data.permission.can_see_agenda;
                            element.permission.can_see_stats = data.permission.can_see_stats;
                            element.permission.can_see_achievements = data.permission.can_see_achievements;
                        }
                    });
                    foundFollower.save().then(
                        (foundFollower) => {
                            return res.status(200).send(foundFollower)
                        },
                        (err) => {
                            return res.status(400).send(
                                {
                                    "action": "Change Permission Settings",
                                    "success": false,
                                    "status": 400,
                                    "error": {
                                        "code": err.errors,
                                        "message": "Error in retrieving Follower"
                                    }
                                })
                        }
                    );
                })
            }
        )

    });
}


exports.populateAgenda = function (req,res,next){
    console.log("POPULATED")
    const requestedUserId = req.params.id;
    LearnerProfile.findById(requestedUserId)
        .select('agenda')
        .populate({
            path:'agenda',
            populate:{
                path:'activity',
                model:"BaseActivity"
            }
        })
        .exec()
        .then(user => {
            console.log("agenda ", user)
            return res.status(200).send(user)
        })
        .catch(err => {
            return res.status(400).send(
                {
                    "action": "Get User Profile",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in retrieving user profile"
                    },
                })
        })
}



exports.addEventToAgenda = function (req, res, next) {
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id


    const { day, start_time, end_time, repeat_weekly, repeat_daily, repeat_monthly, activity, added_by, added_for } = req.body;

    const new_event = {
        'day': day,
        'start_time': start_time,
        'end_time': end_time,
        'repeat_weekly': repeat_weekly,
        'repeat_daily': repeat_daily,
        'repeat_monthly': repeat_monthly,
    }

    Event.create(new_event, function (err, newEvent) {
        if (err) {
            return res.status(400).send(err)
        }
        BaseActivity.findOne(activity, function (err, foundActivity) {
            if (err) {
                return res.status(400).send(err)

            }
            newEvent.activity = foundActivity
        }).then(
            (foundActivity) => {
                UserProfile.findOne({ uid: added_by }, function (err, foundUser) {
                    if (err) {
                        return res.status(400).send(err)

                    }
                    newEvent.added_by = foundUser
                    foundUser.events.push(newEvent);
                    foundUser.save().then(
                        (foundUser) => {
                            UserProfile.findOne({ _id: added_for }, function (err, foundStudent) {
                                if (err) {
                                    return res.status(400).send(err)

                                }
                                newEvent.added_for = foundStudent
                                foundStudent.agenda.push(newEvent);
                                foundStudent.save();
                                newEvent.save().then(
                                    () => {
                                        return res.status(200).send({ "message": "evento aggiunto" })
                                    },
                                    (err) => {
                                        return res.status(400).send(err)

                                    }
                                )
                            })
                        },
                        (err) => {
                            return res.status(400).send(err)

                        }

                    );
                })
            },
            (err) => {
                return res.status(400).send(err)

            }
        )
    })
}

exports.UpdateSocialNetwork = function(req,res,next){
    const requestedUserId = req.params.id;
    const {action, user} = req.body;
    UserProfile.findById(requestedUserId).exec()
        .then(userToBeUpdated=>{

            if(userToBeUpdated){
                UserProfile.findById(user).exec()
                .then(userInNetwork =>{

                    if(action == 'ADD_FOLLOWER'){
                        var obj = {
                            'date': Date.now(),
                            'follower': userInNetwork
                        }
                        userToBeUpdated.followers.push(obj)
                        userToBeUpdated.save(function (err, elem) {
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(200).send(elem)
                        })
                    }
                    else if (action == 'ADD_FOLLOWED'){
                        var obj = {
                            'date': Date.now(),
                            'followed': userInNetwork
                        }
                        userToBeUpdated.followed.push(obj)
                        userToBeUpdated.save(function (err, elem) {
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(200).send(elem)
                        })
                    }
                    else if (action == 'ADD_TEACHER'){
                        var obj = {
                            'date': Date.now(),
                            'teacher': userInNetwork
                        }
                        userToBeUpdated.teachers.push(obj)
                        userToBeUpdated.save(function (err, elem) {
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(200).send(elem)
                        })
                    }
                    else if (action == 'ADD_STUDENT'){
                        var obj = {
                            'date': Date.now(),
                            'learner': userInNetwork
                        }
                        userToBeUpdated.learners.push(obj)
                        userToBeUpdated.save(function (err, elem) {
                            if(err){
                                return res.status(400).send(err)
                            }
                            return res.status(200).send(elem)
                        })
                    }
                    else{
                        return res.status(400).send("invalid action")
                    }
                })
                .catch(err =>{
                    return res.status(400).send(err)

                })
            }
        })
        .catch(err =>{
            return res.status(400).send(err)

        })
}


function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
                UserProfile.findOne({ uid: uid })
                    .exec()
                    .then(foundUser => {
                        resolve(foundUser)
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
            .catch(err => {
                reject(err)
            })
    })

}