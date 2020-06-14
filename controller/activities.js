const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { BaseActivity } = require('../models/activities');
const { UserProfile, TeacherProfile } = require('../models/user_profile');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const logs = require('../controller/log');
const gamification = require('../controller/gamification')

const CREATE_VALUE =  10
const UPDATE_VALUE = 10
const DELETE_VALUE = 10
const EVENT_VALUE = 10
const SOCIAL_VALUE = 10

// da modificare col parametro shared
exports.getActivity = function (req, res, next) {
    console.log("GET ACTIVITY")
    //headers = req.headers;
    BaseActivity.find()
    .exec()
    .then(foundActivities => {
        return res.status(200).send(foundActivities)
    })
    .catch(err => {
        return res.status(422).send(
            {
                "action": "Get Activities ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in retrieving activities"
                }
            }
        )
    })
   
}



exports.getActivityByID = function (req, res, next) {
    console.log("GET BY ID ACTIVITY")
    const attivitaId = req.params.id
    BaseActivity.findById(attivitaId)
        .exec()
        .then(foundActivity => {
            return res.status(200).send(foundActivity)
        })
        .catch(err => {
            return res.status(422).send(
                {
                    "action": "Get Activity by ID ",
                    "success": false,
                    "status": 422,
                    "error": {
                        "code": err.errors,
                        "message": "Error in retrieving activity"
                    }
                }
            )

        })
}

exports.createActivity = function (req, res, next) {
    const action = "Create"
    const category = "Activity"
    const { name, photoURL, description, type, shared, created_by } = req.body;
    console.log(req.body);

    const activity = new BaseActivity({
        'name': name,
        'photoURL': photoURL,
        'description': description,
        'type': type,
        'shared': shared,
        'likes': 0,

    });

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                BaseActivity.create(activity, function (err, newObj) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    else {
                        newObj.created_by = isAuth
                        isAuth.activities.push(newObj);


                        newObj.save(function (err, newObj) {
                            if (err) {
                                return res.status(400).send(err)
                            }
                            else {
                                message = "New Activity was created with ID " + newObj._id
                                logs.createLog(action, category, isAuth, message)
                                var counter = isAuth.game_counter.create_counter + 1;
                                gamification.computeAchievement(isAuth,action,counter)
                                            .then(achievement=>{
                                                console.log("QUI C'è ACHIEVMENT.", achievement)
                                                if(achievement){
                                                    res.status(200).json({ "data": newObj, "achievement": achievement })
                                                }
                                                else{
                                                    res.status(200).json({ "data": newObj})

                                                }
                                            })
                                            .catch(err =>{
                                                console.log(err);
                                                return res.status(400).send(err)
                                            })


                            }
                        })

                    }


                })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Create Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Create Activity",
                }
            })
        })

}


exports.updateActivity = function (req, res, next) {
    const action = "Update"
    const category = "Activity"

    console.log("PATCH")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('id :' + search_id);
    console.log('user', user)
    console.log("valure", req.body)

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                BaseActivity.findById(req.params.id).exec(function (err, foundElement) {
                    //console.log("FOUND ELEMENT:  ", foundElement)
                    if (err) {
                        console.log("sono bloccato in quetsto errore");
                        console.log("i miei errori sono qui:", err.errors);
                        return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    }
                    else {

                        foundElement.set(data);
                        foundElement.save(function (err) {
                            if (err) {
                                console.log("sono solo  qui ");
                                return res.status(422).send({ errors: [{ title: 'Error in save  activity', detail: err.errors }] });
                            }
                            else {
                                message = "New Step was created with ID " + foundElement._id
                                logs.createLog(action, category, isAuth, message)
                                var counter = isAuth.game_counter.update_counter + 1
                                gamification.computeAchievement(isAuth,action,counter)
                                .then(achievement=>{
                                    console.log("QUI C'è ACHIEVMENT.", achievement)
                                    if(achievement){
                                        res.status(200).json({ "data": foundElement, "achievement": achievement })
                                    }
                                    else{
                                        res.status(200).json({ "data": foundElement})

                                    }
                                })
                                .catch(err =>{
                                    console.log(err);
                                    return res.status(400).send(err)
                                })

                                
                            }

                        });
                    }

                })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Patch Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err.errors,
                    "message": "Error in patching activity"
                }
            })
        })

}


exports.deleteActivity = function (req, res, next) {
    const action = "Delete"
    const category = "Activity"

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                BaseActivity.findById(req.params.id)
                    .exec(function (err, foundActivity) {
                        if (err) {
                            console.log(err);
                        }

                        if (foundActivity.created_by != isAuth.id) {
                            return res.status(403).send("You are not the owner")
                        }


                        foundActivity.remove(function (err) {
                            if (err) {
                                // Delete from teachers
                                return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });

                            }
                            isAuth.activities.pull(foundActivity)

                            message = foundActivity._id + " Was Deleted successfully"
                            logs.createLog(action, category, isAuth, message)
                            var counter = isAuth.game_counter.delete_counter + 1
                            gamification.computeAchievement(isAuth,action,counter)
                            .then(achievement=>{
                                console.log("QUI C'è ACHIEVMENT.", achievement)
                                if(achievement){
                                    res.status(200).json({ "data": "", "achievement": achievement })
                                }
                                else{
                                    res.status(200).json({ "data": ""})

                                }
                            })
                            .catch(err =>{
                                console.log(err);
                                return res.status(400).send(err)
                            })

                        });
                    })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Delete Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err.errors,
                    "message": "Error in deleting activity"
                }
            })
        })
}




function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
                // console.log("UDI :", uid)
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