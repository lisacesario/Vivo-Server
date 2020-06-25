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
    console.log("GET QUIZ")
    Step.find({}, function (err, foundStep) {
        if (err) {
            console.log(err);
        }
        return res.json(foundStep);
    })
}

exports.getStepById = function (req, res, next) {
    console.log("GET BY ID QUIZ")
    const stepID = req.params.id
    console.log(stepID)
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
    //console.log(req.file);

    console.log(req.body);


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                const step = new Step({
                    'name': name,
                    'description': description,
                    'imgUrl': imgUrl,
                    'imgSym': imgSym,
                    'shared': shared,
                    'subject': subject,
                    'activities': activities,
                    'created_by': isAuth
                });
                Step.create(step, function (err, newElement) {
                    if (err) {
                        console(err)
                        return res.status(400).send(err)
                    }
                    isAuth.steps.push(newElement);

                    gamification.computeAchievementForCreate(isAuth)
                    .then(object=>{
                        const achievement = object.achievement
                        isAuth.exp = object.user.exp
                        isAuth.achievements = object.user.achievements
                       return achievement
                    })
                    .then((achievement)=>{
                        console.log("OBJ;", achievement)

                        gamification.computeLevelCreate(isAuth)
                            .then(other=>{
                                console.log("levelobk", other)
                                const level = other.level
                                if(level !== null){
                                    isAuth.level = other.user.level
                                }
                              
                                process.nextTick(()=>{
                                    console.log("Programmazione Becera")
                                    isAuth.save(function(err,user){
                                        if(err){
                                            return res.status(400).send(err)
                                        }
                                        else{
                                            if(level && achievement){
                                                return res.status(200).send({"data":newElement, "achievement":achievement,"level":level})
                                            }
                                            else if (level){
                                                return res.status(200).send({"data":newElement,"level":level})
            
                                            }
                                            else if (achievement){
                                                return res.status(200).send({"data":newElement, "achievement":achievement})
            
                                            }
                                            else{
                                                return res.status(200).send({"data":newElement})
            
                                            
                                            }
                                        }
                                    })
                                })
                            })
                    })
                    .catch(err=>{
                        return res.status(400).send(err)
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

    console.log("PATCH")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('id :' + search_id);
    console.log('user', user)
    console.log("valure", req.body)
    //Object.keys(data).forEach(e => console.log(` Activity DATA key=${e}  value=${data[e]}`));
    //Object.keys(req.params).forEach(e => console.log(` req.params DATA key=${e}  value=${req.params[e]}`));
    //Object.keys(req.body).forEach(e => console.log(` req.body DATA key=${e}  value=${req.body[e]}`));

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Step.findById(req.params.id)
                    .exec(function (err, foundElement) {
                        console.log("FOUND ELEMENT:  ", foundElement)
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
                                    console.log("sono solo  qui ");

                                    return res.status(422).send({ errors: [{ title: 'Error in save  activity', detail: err.errors }] });
                                }
                                else {
                                    console.log("NUOVO", foundElement)
                                    // message = foundElement._id + " Was Updated successfully"
                                    // logs.createLog(action, category, isAuth, message)
                                    var counter = isAuth.game_counter.update_counter + 1
                                    gamification.computeAchievement(isAuth, action, counter)
                                        .then(achievement => {
                                            console.log("QUI C'è ACHIEVMENT.", achievement)
                                            gamification.computeLevel(isAuth)
                                                .then(level => {
                                                    console.log("Level", level)
                                                    if (level) {
                                                        if (achievement) {
                                                            res.status(200).json({ "data": foundElement, "achievement": achievement, "level": level })
                                                        }
                                                    }
                                                    else if (achievement) {
                                                        res.status(200).json({ "data": foundElement, "achievement": achievement })

                                                    }
                                                    else {
                                                        res.status(200).json({ "data": foundElement })
                                                    }
                                                })
                                                .catch(err => {
                                                    console.log(err)
                                                    return res.status(400).send(err)
                                                })

                                        })
                                        .catch(err => {
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
    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)

    const action = "Delete"
    const category = "Step"

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Step.findById(req.params.id,
                    function (err, foundStep) {
                        if (err) {
                            console.log(err);
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

                            isAuth.steps.pull(foundStep)
                            message = foundStep._id + " Was Deleted successfully"
                            logs.createLog(action, category, isAuth, message)
                            var counter = isAuth.game_counter.delete_counter + 1

                            gamification.computeAchievement(isAuth, action, counter)
                                .then(achievement => {
                                    console.log("QUI C'è ACHIEVMENT.", achievement)
                                    gamification.computeLevel(isAuth)
                                        .then(level => {
                                            console.log("Level", level)
                                            if (level) {
                                                if (achievement) {
                                                    res.status(200).json({ "data": "", "achievement": achievement, "level": level })
                                                }
                                            }
                                            else if (achievement) {
                                                res.status(200).json({ "data": "", "achievement": achievement })

                                            }
                                            else {
                                                res.status(200).json({ "data": "" })
                                            }
                                        })
                                        .catch(err => {
                                            console.log(err)
                                            return res.status(400).send(err)
                                        })
                                })
                                .catch(err => {
                                    console.log(err);
                                    return res.status(400).send(err)
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

    console.log("AUTH", req.headers)
    console.log("PATCH")
    // const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    //console.log('user', user)
    console.log("data", req.body)
    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                SelfManagementActivity.findById(search_id).exec()
                    .then(foundElement => {
                        console.log("Found Element: \n", foundElement);
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
                                console.log(foundStep)
                                foundStep.activities.push(foundElement);
                                foundStep.save()
                                    .then(foundStep => {
                                        console.log("found quiz saved")
                                        const new_step = {
                                            'position': foundElement.steps.length + 1,
                                            'step': foundStep
                                        }
                                        foundElement.steps.push(new_step);
                                        foundElement.save()
                                            .then(foundElement => {
                                                console.log("FoundActivity saved")
                                                message = "Step " + foundStep._id + " was added to " + foundElement._id
                                                logs.createLog(action, category, isAuth, message)

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
    console.log("Remove step from Activity")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
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
                    console.log("Found Element: /n", activity);
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
                                console.log("pop")
                                console.log("Steps ", activity.steps)
                                activity.steps.forEach(element => {
                                    if (element.step == step.id) {
                                        console.log("poppi")
                                        activity.steps.pop(element)
                                    }
                                })
                                activity.save()
                                message = "Step " + step._id + " was removed from " + activity._id
                                logs.createLog(action, category, isAuth, message)

                                return res.status(200).send(activity)

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
    console.log("Change order of Step from Activity")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    // console.log('activity_id :' + search_id);
    //console.log('user', user)
    console.log("data", req.body)


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            // console.log("is Auth;", isAuth)
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

                    console.log("Previous", activity.steps)
                    activity.steps.forEach(current_step => {
                        data.forEach(actual_step => {
                            if (current_step.step == actual_step.step._id) {
                                if (current_step.position != actual_step.position) {
                                    current_step.position = actual_step.position
                                }
                            }
                        })
                    });
                    console.log("After", activity.steps)

                    activity.save();
                    return res.status(200).send()

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