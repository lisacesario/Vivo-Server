const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Step } = require('../models/steps');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, SelfManagementActivity } = require('../models/activities');
//const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const firebase = require('firebase-admin');
const gamification = require('../controller/gamification')

const logs = require('../controller/log');

// da modificare col parametro shared
exports.getStep = function (req, res, next) {
    Step.find({}, function (err, foundStep) {
        if (err) {
            return res.status(400).send(err)
        }
        return res.json(foundStep);
    })
}

exports.getStepById = function (req, res, next) {
    const stepID = req.params.id
    Step.findById(stepID)
        .exec()
        .then(foundStep => {
            return res.status(200).send(foundStep)
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Get Step by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err.errors,
                    "message": "Error in Step by ID"
                }
            })
        })
}



exports.createStep = function (req, res, next) {
    const action = "Create"
    const category = "Step"

    const { name, description, shared, imgUrl, imgSym, created_by, activities, subject } = req.body;

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                const step_data = new Step({
                    'name': name,
                    'description': description,
                    'imgUrl': imgUrl,
                    'imgSym': imgSym,
                    'shared': shared,
                    'subject': subject,
                    'activities': activities,
                    'created_by': isAuth
                });


                Step.create(step_data, function (err, step) {
                    if (err) {
                        return res.status(400).send(err)
                    }
                    isAuth.exp = isAuth.exp + 10
                    isAuth.game_counter.create_counter = isAuth.game_counter.create_counter + 1;

                    Promise.all([
                        gamification.computeAchievementForCreate(isAuth),
                        gamification.computeLevelCreate(isAuth)
                    ]).then(values => {
                        let achievement = values[0]
                        let level = values[1]

                        if (achievement !== null) {
                            const obj = {
                                "unlocked_time": Date.now(),
                                "unlocked": true,
                                "achievement": achievement
                            }
                            isAuth.achievements.push(obj)
                            isAuth.exp = isAuth.exp + achievement.points
                        }
                        if (level !== null) {
                            isAuth.level.level = level
                            isAuth.level.unlocked_time = Date.now()
                        }

                        isAuth.save(function (err, elem) {
                            //console.log("entri=??")

                            if (err) {
                                res.status(400).send(err)
                            }
                            if (level && achievement) {
                                return res.status(200).send({ "data": step, "achievement": achievement, "level": level })

                            }
                            else if (level) {
                                return res.status(200).send({ "data": step, "level": level })


                            }
                            else if (achievement) {
                                return res.status(200).send({ "data": step, "achievement": achievement })


                            }
                            else {
                                return res.status(200).send({ "data": step })


                            }
                        })
                    }).catch(err => {
                        //console.log(err)
                        return res.send(err)
                    })


                })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Create Step ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Create Step"
                }
            })
        })
}




exports.updateStep = function (req, res, next) {
    const action = "Update"
    const category = "Step"

    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            //console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Step.findById(req.params.id)
                    .exec(function (err, foundElement) {
                        //console.log("FOUND ELEMENT:  ", foundElement)
                        if (err) {
                            return res.status(422).send({ errors: normalizeErrors(err.errors) });
                        }

                        if (isAuth.id != foundElement.created_by) {
                            return res.status(422).send({
                                "action": "Patch Step by ID ",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "message": "You are not the owner"
                                }
                            })
                        }
                        else {
                            foundElement.set(data);
                            foundElement.save(function (err) {
                                if (err) {
                                    //console.log("sono solo  qui ");

                                    return res.status(422).send({ errors: [{ title: 'Error in save  activity', detail: err.errors }] });
                                }
                                isAuth.game_counter.update_counter = isAuth.game_counter.update_counter + 1

                                Promise.all([
                                    gamification.computeAchievement(isAuth, isAuth.game_counter.update_counter, "Update"),
                                    gamification.computeLevelCreate(isAuth)
                                ]).then(values => {
                                    //console.log(values)
                                    let achievement = values[0]
                                    let level = values[1]
    
                                    if (achievement !== null) {
                                        const obj = {
                                            "unlocked_time": Date.now(),
                                            "unlocked": true,
                                            "achievement": achievement
                                        }
                                        isAuth.achievements.push(obj)
                                        isAuth.exp = isAuth.exp + achievement.points
                                    }
                                    if (level !== null) {
                                        isAuth.level.level = level
                                        isAuth.level.unlocked_time = Date.now()
                                    }
    
                                    isAuth.save(function (err, elem) {
                                        //console.log("entri=??")
    
                                        if (err) {
                                            res.status(400).send(err)
                                        }
                                        if (level && achievement) {
                                            return res.status(200).send({ "data": foundElement, "achievement": achievement, "level": level })
    
                                        }
                                        else if (level) {
                                            return res.status(200).send({ "data": foundElement, "level": level })
    
    
                                        }
                                        else if (achievement) {
                                            return res.status(200).send({ "data": foundElement, "achievement": achievement })
    
    
                                        }
                                        else {
                                            return res.status(200).send({ "data": foundElement })
    
    
                                        }
                                    })
                                }).catch(err => {
                                    //console.log(err)
                                    return res.send(err)
                                })


                            });
                        }

                    })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Patch Step by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err.errors,
                    "message": "Error in Step by ID"
                }
            })
        })


}



exports.deleteStep = function (req, res, next) {
    //console.log("AUTH", req.headers)
    //console.log("ID ", req.params.id)

    const action = "Delete"
    const category = "Step"

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            //console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Step.findById(req.params.id,
                    function (err, foundStep) {
                        if (err) {
                            //console.log(err);
                        }

                        if (foundStep.created_by != isAuth.id) {
                            return res.status(403).send("You are not the owner")
                        }
                        foundStep.remove(function (err) {
                            if (err) {
                                // Delete from teachers
                                return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });

                            }
                            if (foundStep.activities.length !== 0) {
                                foundStep.activities.forEach(element => {
                                    BaseActivity.findById(element, function (err, foundActivity) {
                                        if (err) {
                                            return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                                        }
                                        foundActivity.steps.forEach(current_step => {
                                            if (current_step.step == foundStep) {
                                                foundActivity.steps.pull(current_step);
                                            }
                                        })

                                        foundActivity.save()
                                    })
                                });
                            }

                            //                            message = foundStep._id + " Was Deleted successfully"
                            //                            logs.createLog(action, category, isAuth, message)
                            //                            var counter = isAuth.game_counter.delete_counter + 1


                            isAuth.game_counter.delete_counter = isAuth.game_counter.delete_counter + 1

                            Promise.all([
                                gamification.computeAchievement(isAuth, isAuth.game_counter.delete_counter, "Delete"),
                                gamification.computeLevelCreate(isAuth)
                            ]).then(values => {
                                //console.log(values)
                                let achievement = values[0]
                                let level = values[1]

                                if (achievement !== null) {
                                    const obj = {
                                        "unlocked_time": Date.now(),
                                        "unlocked": true,
                                        "achievement": achievement
                                    }
                                    isAuth.achievements.push(obj)
                                    isAuth.exp = isAuth.exp + achievement.points
                                }
                                if (level !== null) {
                                    isAuth.level.level = level
                                    isAuth.level.unlocked_time = Date.now()
                                }

                                isAuth.save(function (err, elem) {
                                    //console.log("entri=??")

                                    if (err) {
                                        res.status(400).send(err)
                                    }
                                    if (level && achievement) {
                                        return res.status(200).send({ "data": "", "achievement": achievement, "level": level })

                                    }
                                    else if (level) {
                                        return res.status(200).send({ "data": "", "level": level })


                                    }
                                    else if (achievement) {
                                        return res.status(200).send({ "data": "", "achievement": achievement })


                                    }
                                    else {
                                        return res.status(200).send({ "data": "" })


                                    }
                                })
                            }).catch(err => {
                                //console.log(err)
                                return res.send(err)
                            })
                        });
                    });
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Delete Step ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Delete Step"
                }
            })
        })



}


exports.addStepToActivity = function (req, res, next) {
    const action = "Add"
    const category = "Step"

    //console.log("AUTH", req.headers)
    //console.log("PATCH")
    // const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    //console.log('activity_id :' + search_id);
    ////console.log('user', user)
    //console.log("data", req.body)
    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            //console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                SelfManagementActivity.findById(search_id).exec()
                    .then(foundElement => {
                        //console.log("Found Element: \n", foundElement);
                        if (foundElement.created_by != isAuth.id) {
                            return res.status(403).send({
                                "action": "Add Step to Activity",
                                "success": false,
                                "status": 403,
                                "error": {
                                    "message": "You can't add elements in Activity. You are not the owner"
                                }
                            })
                        }
                        Step.findById(data._id).exec()
                            .then(foundStep => {
                                //console.log(foundStep)
                                foundStep.activities.push(foundElement);
                                foundStep.save()
                                    .then(foundStep => {
                                        //console.log("found quiz saved")
                                        const new_step = {
                                            'position': foundElement.steps.length + 1,
                                            'step': foundStep
                                        }
                                        foundElement.steps.push(new_step);
                                        foundElement.save()
                                            .then(foundElement => {
                                                ////console.log("FoundActivity saved")
                                                //message = "Step " + foundStep._id + " was added to " + foundElement._id
                                                //logs.createLog(action, category, isAuth, message)
                                                return res.status(200).send(foundElement)
                                            })
                                            .catch(err => {
                                                return res.status(422).send({
                                                    "action": "Add Step to Activity ",
                                                    "success": false,
                                                    "status": 422,
                                                    "error": {
                                                        "code": err,
                                                        "message": "add in Step by ID"
                                                    }
                                                })
                                            })
                                    })
                                    .catch(err => {
                                        return res.status(422).send({
                                            "action": "Add Step to Activity ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err,
                                                "message": "add in Step by ID"
                                            }
                                        })
                                    })


                            })
                            .catch(err => {
                                return res.status(422).send({
                                    "action": "Add Step to Activity ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "Error adding in Step in activity"
                                    }
                                })
                            })

                    })
                    .catch(err => {
                        return res.status(422).send({
                            "action": "Add Step to Activity ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "add in Step by ID"
                            }
                        })
                    })
            }

        })
        .catch(err => {
            return res.status(422).send({
                "action": "Add Step to Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "add in Step by ID"
                }
            })
        })




}


exports.removeStepFromActivity = function (req, res, next) {
    const action = "Remove"
    const category = "Step"
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                SelfManagementActivity.findById(search_id).exec(function (err, activity) {

                    if (err) {
                        return res.status(422).send({
                            "action": "Remove Step from Activity ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Remove Step from Activity"
                            }
                        })
                    }

                    if (activity.created_by != isAuth.id) {
                        return res.status(403).send({
                            "action": "Remove Step from Activity ",
                            "success": false,
                            "status": 403,
                            "error": {
                                "message": "You are not the owner"
                            }
                        })
                    }
                    Step.findById(data._id)
                        .exec(function (err, step) {
                            if (err) {
                                return res.status(422).send({
                                    "action": "Remove Step from Activity ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "Remove Step from Activity"
                                    }
                                })
                            }
                            else {
                                step.activities.pop(activity);
                                step.save()
                                 activity.steps.forEach(element => {
                                    if (element.step == step.id) {
                                        //console.log("poppi")
                                        activity.steps.pop(element)
                                    }
                                })
                                activity.save(function(err, obj){
                                    if(err){
                                        return res.status(400).send(err)
                                    }
                                    else{
                                        return res.status(200).send(activity)
                                    }
                                })

                            }

                        })
                })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Remove Step from Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Remove Step from Activity"
                }
            })
        })

}


exports.changeOrder = function (req, res, next) {
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                SelfManagementActivity.findById(search_id).exec(function (err, activity) {

                    if (err) {
                        return res.status(422).send({
                            "action": "Change order Step from Activity",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Remove Step from Activity"
                            }
                        })
                    }

                    if (activity.created_by != isAuth.id) {
                        return res.status(403).send({
                            "action": "Change order Step from Activity ",
                            "success": false,
                            "status": 403,
                            "error": {
                                "message": "You are not the owner"
                            }
                        })
                    }

                    activity.steps.forEach(current_step => {
                        data.forEach(actual_step => {
                            if (current_step.step == actual_step.step._id) {
                                if (current_step.position != actual_step.position) {
                                    current_step.position = actual_step.position
                                }
                            }
                        })
                    });

                    activity.save(function(err,activity){
                        if(err){
                            return res.status(400).send(err)
                        }
                        else{
                            return res.status(200).send(activity)
                        }
                    });

                })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Change order Step from Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Change order Step from Activity",
                }
            })
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
                        reject()
                    })
            })
            .catch(err => {
                reject()
            })
    })

}