const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, QuizActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const logs =  require('../controller/log');

const { Event } = require('../models/events');

exports.getEventById = function (req, res, next) {
    console.log("GET BY ID QUIZ")
    const search_id = req.params.id
    console.log(search_id)
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
                Event.findById(search_id)
                    .exec()
                    .then(event => {
                        return res.status(200).send(event)
                    })
                    .catch(err => {
                        return res.status(422).send({
                            "action": "Get Event by ID ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Error in retrieving event by ID"
                            }
                        })
                    })
            }
        })
        .catch(err=>{
            return res.status(400).send(err)
        })
}

exports.createEvent = function (req, res, next) {
    const action = "Create Event"
    const category = "Agenda Events"

    const { day, start_time, end_time, repeat_weekly, repeat_daily, repeat_monthly, activity, added_by, added_for, added_at } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const event = new Event({
        'day': day,
        'start_time': start_time,
        'end_time': end_time,
        'repeat_weekly': repeat_weekly,
        'repeat_daily': repeat_daily,
        'repeat_monthly': repeat_monthly,
        'added_at': added_at,

    });

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
                if(isAuth.role == "Teacher"){
                    Event.create(event, function (err, new_event) {
                        if (err) {
                            message = err
                            logs.createLog(action,category,isAuth,message)
                            return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                        }
                        new_event.added_by = isAuth
                        isAuth.events.push(new_event)
                        isAuth.save();
    
                        BaseActivity.findById(activity).exec()
                                    .then( foundActivity=>{
                                        new_event.activity = foundActivity;
    
                                        UserProfile.findById(added_for).exec()
                                                    .then( student =>{
                                                        console.log("student")
                                                        new_event.added_for = student
                                                        student.agenda.push(new_event)

                                                        student.save()

                                                        new_event.save(function(err,newEvent){
                                                            if(err){
                                                                return res.status(422).send({
                                                                    "action": "Create new Event ",
                                                                    "success": false,
                                                                    "status": 422,
                                                                    "error": {
                                                                        "code": err,
                                                                        "message": "Error in create event "
                                                                    }
                                                                })
                                                            }
                                                            else{
                                                                console.log("Crea il mio Log")
                                                                message = "New Event created with ID " + new_event.id
                                                                logs.createLog(action,category,isAuth,message)
                                                                return res.status(200).send(new_event)
                                                            }
                                                        })

                                                       
                                                    })
                                                    .catch( err =>{
                                                        message = err
                                                        logs.createLog(action,category,isAuth,message)
                                                        return res.status(422).send({
                                                            "action": "Create new Event ",
                                                            "success": false,
                                                            "status": 422,
                                                            "error": {
                                                                "code": err,
                                                                "message": "Error in create event "
                                                            }
                                                        })
                                                    })
                                    })
                                    .catch(err =>{
                                        message = err
                                        logs.createLog(action,category,isAuth,message)
                                        return res.status(422).send({
                                            "action": "Create new Event ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err,
                                                "message": "Error in create event "
                                            }
                                        })
                                    })                    
                    })
                }
                else{
                    message = "You are not authorized. Your role not allows to create new event"
                    logs.createLog(action,category,isAuth,message)
                    return res.status(403).send("You are not authorized. Your role not allows to create new event")
                }
               
            }
        })
        .catch(err=>{
            message = err
            logs.createLog(action,category,isAuth,message)
            return res.status(422).send({
                "action": "Create new Event ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in create event "
                }
            })
        })

}

exports.updateEvent = function (req, res, next) {
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
               
            }
        })
        .catch(err=>{
            return res.status(400).send(err)
        })
}



exports.deleteEvent = function (req, res, next) {
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
              
            }
        })
        .catch(err=>{
            return res.status(400).send(err)
        })
}


function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
                console.log("UDI", uid)
                UserProfile.findOne({ uid: uid })
                    .exec()
                    .then(foundUser => {
                        console.log(foundUser)
                        resolve(foundUser)
                    })
                    .catch(err => {
                        reject()
                    })
            })
            .catch(err => {
                reject()
            })
    })

}