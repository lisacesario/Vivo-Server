const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Step } = require('../models/steps');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, SelfManagementActivity } = require('../models/activities');
//const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const firebase = require('firebase-admin');


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
    console.log("CREATE STEP")
    const { name, description, shared, imgUrl, imgSym, created_by, activities, subject } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const step = new Step({
        'name': name,
        'description': description,
        'imgUrl': imgUrl,
        'imgSym': imgSym,
        'shared': shared,
        'subject': subject,
        'activities' : activities
    });
    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Step.create(step, function (err, newElement) {
                    if (err) {
                        return res.status(400).send(err)
                    }
                    console.log("sono qui")
                    newElement.created_by = isAuth;
                    isAuth.steps.push(newElement);
                    isAuth.save()
                    console.log("anche qui. isauth saved")
                    newElement.save();
                    return res.status(200).send(newElement)
                })
            }
        })
        .catch( err =>{
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

                    if(isAuth.id != foundElement.created_by){
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
                                return res.status(422).send({ errors: [{ title: 'Error in save  step', detail: err.errors }] });
                            }
                            else {
                                console.log("NUOVO", foundElement)
                                return res.status(200).json(foundElement);
                            }
        
                        });
                    }
        
                })
            }
        })
        .catch( err =>{
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

                        if(foundStep.created_by != isAuth.id){
                            return res.status(403).send("You are not the owner")
                        }
                        foundStep.remove(function (err) {
                            if (err) {
                                // Delete from teachers
                                return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });
    
                            }
                            if(foundStep.activities.length !==0){
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
                            isAuth.save()
                            return res.json({ "status": "deleted" });
                        });
            
                    });
            }
        })
        .catch( err =>{
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
                                        .then(foundStep =>{
                                            console.log("found quiz saved")
                                            const new_step = {
                                                'position': foundElement.steps.length + 1,
                                                'step': foundStep
                                            }
                                            foundElement.steps.push(new_step);
                                            foundElement.save()
                                                        .then(foundElement=>{
                                                            console.log("FoundActivity saved")
                                                            return res.status(200).send(foundElement)
                                                        })
                                                        .catch(err =>{
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
                                        .catch(err =>{
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
    console.log("Remove Tool from Activity")
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

                    if(activity.created_by != isAuth.id){
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
                                activity.steps.forEach( element =>{
                                    if(element.step == step.id){
                                        console.log("poppi")
                                        activity.steps.pop(element)
                                    }
                                })
                                activity.save()
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


exports.changeOrder = function(req,res,next){
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)
}



function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
                console.log("UDI :", uid)
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