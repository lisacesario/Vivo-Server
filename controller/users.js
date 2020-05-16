const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { UserProfile } = require('../models/user_profile');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');

const { BaseActivity } = require('../models/activities');
const { Event } = require('../models/events');
var async = require('async');


exports.createUser = function (req, res, next) {
    console.log("Create User")
    const { uid, email, role, photoURL, displayName } = req.body;
    console.log("User Profile ", uid, email, role, photoURL, displayName);
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
                })        }

        newProfile.save().then(
            () => {
                return res.status(200).send(newProfile)
            },
            (err) => {
                return res.status(400).send(
                    {
                        "action": "Create User Profile",
                        "success": false,
                        "status": 400,
                        "error": {
                            "code": err,
                            "message": "Error in create user profile"
                        },
                    })
            }
        )
    });
}

exports.getUser = function (req, res, next) {
    console.log("Get auth user")
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
    console.log("Get tutti i profili Utenti")
    const requestedUserId = req.params.id;
    console.log("bu:", requestedUserId)

    UserProfile.find()
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
                        "code": err.errors,
                        "message": "Error in retrieving users profiles"
                    }
                })
        })

}

exports.getUserProfileById = function (req, res, next) {
    console.log("getUserProfileById")
    const requestedUserId = req.params.id;
    //console.log("bu" , requestedUserId)
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
                        "code": err.errors,
                        "message": "Error in retrieving user profile"
                    }
                })
        })
}



exports.patchUser = function (req, res, next) {
    console.log("PATCH")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('id :' + search_id);
    console.log("valure", req.body)
    //Object.keys(data).forEach(e => console.log(` Activity DATA key=${e}  value=${data[e]}`));
    //Object.keys(req.params).forEach(e => console.log(` req.params DATA key=${e}  value=${req.params[e]}`));
    //Object.keys(req.body).forEach(e => console.log(` req.body DATA key=${e}  value=${req.body[e]}`));


    UserProfile.findOne({ uid: search_id })
        .exec()
        .then(user => {
            if (user.uid != search_id) {
                console.log("created by ", user.uid);
                console.log("hser ", search_id);
                console.log("sono bloccato");
                return res.status(403).send(
                    {
                        "action": "Patch User Profile",
                        "success": false,
                        "status": 403,
                        "error": {
                            "message": "Error in patch user profile: You are not the owner"
                        }
                    })
            }
            user.set(data)
            user.save()
                .then(user => {
                    return res.status(200).send(user)
                })
                .catch(err => {
                    return res.status(400).send(
                        {
                            "action": "Patch User Profile",
                            "success": false,
                            "status": 400,
                            "error": {
                                "code": err.errors,
                                "message": "Error in patch user profile"
                            }
                        })
                })

        })
        .catch(err => {
            return res.status(400).send(
                {
                    "action": "Patch User Profile",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in patch user profile"
                    }
                })
        })

}


/*
* @: ROUTE
*/
exports.sendingFriendshipRequest = async function (req, res, next) {
    const requestedUserId = req.params.id;
    const user = res.locals.user;
    const data = req.body;
    console.log("sender", requestedUserId)
    console.log("reciever : ", data)

    UserProfile.findOne({ uid: requestedUserId })
                .exec()
                .then(sender =>{
                    UserProfile.findById(data._id)
                                .exec()
                                .then(receiver =>{
                                    console.log(sender)
                                    console.log(receiver)

                                    var friendshipReceiverRequest = {
                                        'read': false,
                                        'request_accepted': false,
                                        'follower_id': sender
                                    }
                        
                                    var friendshipSenderRequest = {
                                        'request_accepted': false,
                                        'followed_id': receiver
                                    }

                                    receiver.followers.push(friendshipReceiverRequest);
                                    sender.followed.push(friendshipSenderRequest);
                                    receiver.save()
                                    sender.save()
                                    return res.status(200).send()
                                    
                                })
                                .catch( (err) => {
                                    return res.status(422).send(
                                        {
                                            "action": "Send Following request ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err.errors,
                                                "message": "Error in send user following request"
                                            }
                                        })
                                })
                })
                .catch( (err) => {
                    return res.status(422).send(
                        {
                            "action": "Send Following request ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in send user following request"
                            }
                        })
                })


}

exports.acceptRequest = function (req, res, next) {
    console.log("Accept Request")

    const requestedUserId = req.params.id;
    const data = req.body;
    console.log("data", data)
    UserProfile.findOne({ uid: requestedUserId })
                .exec()
                .then(foundUser =>{
                        foundUser.followers.forEach(request => {
                            if (request.follower_id == data.follower_id) {
                                request.read = true;
                                request.request_accepted = true;
                                console.log("Accetta la richiesta")
                            }
                        });
                        foundUser.save()

                        UserProfile.findById(data.follower_id)
                                    .exec()
                                    .then(foundFollower =>{
                                        foundFollower.followed.forEach(request => {
                                            console.log(request.followed_id._id)
                                            console.log(foundUser._id)
                        
                                            if (request.followed_id.equals(foundUser._id)) {
                                                request.request_accepted = true;
                                                console.log("Ciaone")
                                            }
                                        })
                                        foundFollower.save()
                                                    .then(foundFollower =>{
                                                        return res.status(200).send(foundFollower)
                                                    })
                                                    .catch(err =>{
                                                        return res.status(422).send(
                                                            {
                                                                "action": "Accept Following request ",
                                                                "success": false,
                                                                "status": 422,
                                                                "error": {
                                                                    "code": err,
                                                                    "message": "Error in accept following request"
                                                                }
                                                            })
                                                    })
                                          
                                    })
                                    .catch(err=>{
                                        return res.status(422).send(
                                            {
                                                "action": "Accept Following request ",
                                                "success": false,
                                                "status": 422,
                                                "error": {
                                                    "code": err.errors,
                                                    "message": "Error in accept following request"
                                                }
                                            })
                                    })
                                    
                })
                .catch(err=>{
                    return res.status(422).send(
                        {
                            "action": "Accept Following request ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in accept following request"
                            }
                        })
                })
}



exports.refuseRequest = function (req, res, next) {
    console.log("Refuse Request")

    const requestedUserId = req.params.id;
    const data = req.body;
    console.log("data", data)

    UserProfile.findOne({ uid: requestedUserId })
                .exec()
                .then(foundUser => {
                    foundUser.followers.forEach(request => {
                        if (request.follower_id == data.follower_id) {
                            foundUser.followers.pop(request);
                        }
                    });
                    foundUser.save()

                    UserProfile.findById(data.follower_id)
                                .exec()
                                .then(foundFollower => {
                                    foundFollower.followed.forEach(request => {
                                        if (request.followed_id.equals(foundUser._id)) {
                                            foundFollower.followed.pop(request)
                                        }
                                    })
                                    foundFollower.save()
                                                .then(foundFollower=>{
                                                    return res.status(200).send(foundFollower)
                                                })
                                                .catch(err => {
                                                    return res.status(422).send(
                                                        {
                                                            "action": "Refuse Following request ",
                                                            "success": false,
                                                            "status": 422,
                                                            "error": {
                                                                "code": err,
                                                                "message": "Error in refuse following request"
                                                            }
                                                        })
                                                })

                                })
                                .catch(err => {
                                    return res.status(422).send(
                                        {
                                            "action": "Refuse Following request ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err,
                                                "message": "Error in refuse following request"
                                            }
                                        })
                                })
            
                })
                .catch(err => {
                    return res.status(422).send(
                        {
                            "action": "Refuse Following request ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Error in refuse following request"
                            }
                        })
                })

}


exports.sendBeMyTeacherRequest = function (req, res, next) {
    const requestedUserId = req.params.id;
    const user = res.locals.user;
    const data = req.body;
    console.log("requested", requestedUserId)
    console.log("futureFriensd : ", data)

    UserProfile.findOne({ uid: requestedUserId })
                .exec()
                .then(student =>{
                    console.log(" Student", student);
                    UserProfile.findById(data._id)
                                .exec()
                                .then(teacher =>{

                                    var learnerRequest = {
                                        'request_accepted': false,
                                        'learner_id': student
                                    }
                                    var teacherRequest = {
                                        'request_accepted': false,
                                        'teacher_id': teacher
                                    }

                                    teacher.learner_list.push(learnerRequest)
                                    teacher.save()
                                    
                                    student.teacher_list.push(teacherRequest)
                                    student.save()
                                    return res.status(200).send()
                                           
                                })
                                .catch(err=>{
                                    return res.status(422).send(
                                        {
                                            "action": "Send Teacher request ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err.errors,
                                                "message": "Error in send user teaching request"
                                            }
                                        })
                                })
                })
                .catch(err=>{
                    return res.status(422).send(
                        {
                            "action": "Send Teacher request ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in send user teaching request"
                            }
                        })
                })   

}

exports.acceptBeMyTeacherRequest = function (req, res, next) {

}

exports.refuseBeMyTeacherRequest = function (req, res, next) {

}



exports.sendBeMyStudentRequest = function (req, res, next) {
    const requestedUserId = req.params.id;
    const user = res.locals.user;
    const data = req.body;
    console.log("requested", requestedUserId)
    console.log("futureFriensd : ", data)


    UserProfile.findOne({ uid: requestedUserId })
                .exec()
                .then(teacher =>{
                    console.log(" Teacher", teacher);
                    UserProfile.findById(data._id)
                                .exec()
                                .then(student =>{

                                    var learnerRequest = {
                                        'request_accepted': false,
                                        'learner_id': student
                                    }
                                    var teacherRequest = {
                                        'request_accepted': false,
                                        'teacher_id': teacher
                                    }

                                    teacher.learner_list.push(learnerRequest)
                                    teacher.save()
                                    
                                    student.teacher_list.push(teacherRequest)
                                    student.save()
                                    return res.status(200).send(student)
                                           
                                })
                                .catch(err=>{
                                    return res.status(422).send(
                                        {
                                            "action": "Send Teacher request ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err.errors,
                                                "message": "Error in send user teaching request"
                                            }
                                        })
                                })
                })
                .catch(err=>{
                    return res.status(422).send(
                        {
                            "action": "Send Teacher request ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in send user teaching request"
                            }
                        })
                })   

}

exports.acceptBeMyStudentRequest = function (req, res, next) {

}

exports.refuseBeMyStudentRequest = function (req, res, next) {

}


exports.permissionSettings = function (req, res, next) {


    const requestedUserId = req.params.id;
    const data = req.body;
    console.log("data", data)
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
        console.log("Elementi Trovato", foundUser);
        foundUser.followers.forEach(follower => {
            if (follower.follower_id == data.follower_id) {
                follower.permission.can_write = data.permission.can_write_me;
                follower.permission.can_see_bio_info = data.permission.can_see_my_bio_info;
                follower.permission.can_see_followed_list = data.permission.can_see_my_followed_list;
                follower.permission.can_see_follower_list = data.permission.can_see_my_follower_list;
                follower.permission.can_see_agenda = data.permission.can_see_agenda;
                follower.permission.can_edit_agenda = data.permission.can_edit_agenda;
                follower.permission.can_see_stats = data.permission.can_see_stats;
                follower.permission.can_see_achievements = data.permission.can_see_achievements;
                console.log("Cambia i permessi la richiesta")
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
                            element.permission.can_edit_agenda = data.permission.can_edit_agenda;
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


exports.addEventToAgenda = function (req, res, next) {
    console.log("Add event to agenda")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)

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
            console.log(err);
        }
        BaseActivity.findOne(activity, function (err, foundActivity) {
            if (err) {
                console.log(err);
            }
            newEvent.activity = foundActivity
        }).then(
            (foundActivity) => {
                UserProfile.findOne({ uid: added_by }, function (err, foundUser) {
                    if (err) {
                        console.log(err);
                    }
                    newEvent.added_by = foundUser
                    foundUser.events.push(newEvent);
                    foundUser.save().then(
                        (foundUser) => {
                            UserProfile.findOne({ _id: added_for }, function (err, foundStudent) {
                                if (err) {
                                    console.log(err);
                                }
                                newEvent.added_for = foundStudent
                                foundStudent.agenda.push(newEvent);
                                foundStudent.save();
                                newEvent.save().then(
                                    () => {
                                        return res.status(200).send({ "message": "evento aggiunto" })
                                    },
                                    (err) => {
                                        console.log("Errore", err)
                                    }
                                )
                            })
                        },
                        (err) => {
                            console.log("Errore", err)
                        }

                    );
                })
            },
            (err) => {
                console.log("Errore", err)
            }
        )
    })
}


/*
exports.auth = function(req,res, next){
    const {email, password} = req.body;

    if(!password || !email){
        return res.status(422).send({ title: "Data Missing!", detail:"Provide Email and Passowrd"});
    }

    UserProfile.findOne({email}, function(err,user){
        if (err){
            return res.status(422).send({ errors: err.errors });

        }
        if(!user){
            return res.status(422).send({ title: "AUTH ERROR", detail:"user doesn't exist"});
        }
        if(user.hasSamePassword(password)){

            firebase.auth().signInWithEmailAndPassword(email, password).then(
                (elemento)=>{
                    console.log("Login completato con successo",elemento)
                    // return JWT Token
                    const token= jwt.sign({
                        userId: user.id,
                        displayName : user.displayName || "Utente appena registrato"
                    }, config.SECRET, { expiresIn: '1h' });

                    return res.json(token);
                }
            )
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                return res.status(errorCode).sent({title:"AUTH ERROR", detail:"errorMessage"})
              });
        }
        else{
            return res.status(422).send({ title: "AUTH ERROR", detail:"wrong email or password"});

        }


    });
}



exports.getUser = function(req,res,next){
    console.log("req :", req.params);
    console.log("res :", res.locals.user);

    const requestedUserId = req.params.id;
    const user = res.locals.user;

    console.log("req user: ",requestedUserId);
    console.log("user: ", user)

    if( requestedUserId === user.id ){
        // Display all information
        UserProfile.findById(requestedUserId, function(err, foundUser){
            if(err){
                // da riscrivere
                return  res.status(422).send({ title: "Data Missing!", detail:"Provide Email and Passowrd"});
            }
            return res.json(foundUser);
        })
    }
    else{
        // restrict some data
        UserProfile.findById(requestedUserId)
            .populate('-email -password')
            .exec(function(err,foundUser){
                if(err){
                    // da riscrivere
                    return  res.status(422).send({ title: "Data Missing!", detail:err.errors});
                }
                return res.json(foundUser);
            })
    }
}


exports.register = function(req,res, next){
    const {displayName, email, password, passwordConfirmation, role} = req.body;

    if(!password || !email){
        return res.status(422).send({ title: "Data Missing!", detail:"Provide Email and Passowrd"});
    }
    if(password !== passwordConfirmation){
        return res.status(422).send({ title: "Invalid  password!", detail:"password is not the same as confirmation "});
    }

    UserProfile.findOne({email: email}, function (err, existingUser){
        if (err){
            return res.status(422).send({ title: "no idea of the erorr", detail:err});

        }
        if (existingUser){
            return res.status(422).send({ title: "User with this email already exists  !", detail:"dettaglio "});
        }
    });

    firebase.auth().createUser({
        email : email,
        password: password,
        displayName:displayName,
        role: role
        })
            .then(
                (elemento)=>{
                    console.log(elemento.uid);
                    uid = elemento.uid
                    const user = new UserProfile({
                        uid,
                        displayName,
                        email,
                        password,
                        role
                    });
                    user.save(function(err){
                        if(err){
                            return res.status(422).send({ title: "Errore nella creazione  !", detail: err.message});
                        }
                        return res.json({'registered': true});
                    })
                }
            )
            .then({

            })
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                return res.status(errorCode).send(errorMessage);
            });

}

function sendEmailVerification(email){
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then(function() {
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
        })
        .catch(function(error) {
            // Some error occurred, you can inspect the code: error.code
        });
        }

exports.authMiddleware = function(req, res, next) {
    const token = req.headers.authorization;

    if (token) {
      const user = parseToken(token);

      UserProfile.findById(user.userId, function(err, user) {
        if (err) {
          return res.status(422).send({errors: normalizeErrors(err.errors)});
        }

        if (user) {
          res.locals.user = user;
          next();
        } else {
          return notAuthorized(res);
        }
      })
    } else {
      return notAuthorized(res);
    }
  }


exports.logout = function(req,res,next){
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        return res.json({'message': "Logout Successfull"});
      }).catch(function(error) {
        // An error happened.
      });
}


function parseToken(token){
    return  jwt.verify(token.split(' ')[1], config.SECRET);
}

function notAuthorized(res) {
    return res.status(401).send({errors: [{title: 'Not authorized!', detail: 'You need to login to get access!'}]});
  }

  */

