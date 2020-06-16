const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Question } = require('../models/question');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, QuizActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const gamification = require('../controller/gamification')

const logs = require('../controller/log');


// da modificare col parametro shared
exports.getQuestion = function (req, res, next) {
    Question.find({}, function (err, foundQuiz) {
        if (err) {
            console.log(err);
        }
        return res.json(foundQuiz);
    })
}

exports.getQuestionById = function (req, res, next) {
    console.log("GET BY ID QUIZ")
    const questionID = req.params.id
    Question.findById(questionID)
        .exec()
        .then(foundQuestion => {
            return res.status(200).send(foundQuestion)
        })
        .catch(err => {

            return res.status(422).send({
                "action": "Get Question by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in Question by ID"
                }
            })
        })
}



exports.createQuiz = function (req, res, next) {
    const action = "Create"
    const category = "Question"

    const { question, imgUrl, environment, shared, created_by } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const data = new Question({
        'question': question,
        'imgUrl': imgUrl,
        'environment': environment,
        'shared': shared
    });

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Question.create(data, function (err, newQuestion) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    newQuestion.created_by = isAuth
                    isAuth.questions.push(newQuestion)
                    newQuestion.save(function (err, newQuestion) {
                        if (err) {
                            console.log(err);
                            return res.status(200).send(err)
                        }
                        else {
                            message = "New Question created with ID " + newQuestion._id
                            logs.createLog(action, category, isAuth, message)
                            console.log("logs creati")
                            var counter = isAuth.game_counter.create_counter + 1;
                            gamification.computeAchievement(isAuth,action,counter)
                            .then(achievement=>{
                                console.log("QUI C'è ACHIEVMENT.", achievement)
                                gamification.computeLevel(isAuth)
                                            .then(level=>{
                                                console.log("Level",level)
                                                if(level){
                                                    if(achievement){
                                                        res.status(200).json({ "data": newQuestion, "achievement": achievement, "level":level })
                                                    }
                                                }
                                                else if(achievement){
                                                    res.status(200).json({ "data": newQuestion, "achievement": achievement })

                                                }
                                                else{
                                                    res.status(200).json({ "data": newQuestion})
                                                }
                                            })
                                            .catch(err=>{
                                                console.log(err)
                                                return res.status(400).send(err)
                                            })
                        })
                            .catch(err =>{
                                console.log(err);
                                return res.status(400).send(err)
                            })
                        }
                    })


                })

            }
        })
        .catch(err => {
            return res.status(400).send(err)
        })

}



exports.updateQuestion= function (req, res, next) {
    const action = "Update"
    const category = "Question"
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('id :' + search_id);
    console.log('user', user)
    console.log("valure", req.body)
    //Object.keys(data).forEach(e => console.log(` Activity DATA key=${e}  value=${data[e]}`));
    //Object.keys(req.params).forEach(e => console.log(` req.params DATA key=${e}  value=${req.params[e]}`));
    //Object.keys(req.body).forEach(e => console.log(` req.body DATA key=${e}  value=${req.body[e]}`));

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Question.findById(req.params.id)
                    .exec(function (err, foundElement) {

                        console.log("FOUND ELEMENT:  ", foundElement)
                        if (err) {
                            return res.status(422).send({
                                "action": "Update Quiz by ID ",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": err,
                                    "message": "Update in quiz by ID"
                                }
                            })
                        }
                        else {
                            if (foundElement.created_by != isAuth.id) {
                                return res.status(403).send({
                                    "action": "Patch Quiz by ID ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "You are not the owner"
                                    }
                                })
                            }
                            foundElement.set(data);
                            foundElement.save(function (err) {
                                if (err) {
                                    return res.status(422).send({
                                        "action": "Update Quiz by ID ",
                                        "success": false,
                                        "status": 422,
                                        "error": {
                                            "code": err,
                                            "message": "Update in quiz by ID"
                                        }
                                    })
                                }
                                else {
                                    console.log("NUOVO", foundElement)
                                    message = foundElement._id + " Was Updated successfully"
                                    logs.createLog(action, category, isAuth, message)
                                    var counter = isAuth.game_counter.update_counter + 1
                                    gamification.computeAchievement(isAuth,action,counter)
                                    .then(achievement=>{
                                        console.log("QUI C'è ACHIEVMENT.", achievement)
                                        gamification.computeLevel(isAuth)
                                                    .then(level=>{
                                                        console.log("Level",level)
                                                        if(level){
                                                            if(achievement){
                                                                res.status(200).json({ "data": foundElement, "achievement": achievement, "level":level })
                                                            }
                                                        }
                                                        else if(achievement){
                                                            res.status(200).json({ "data": foundElement, "achievement": achievement })

                                                        }
                                                        else{
                                                            res.status(200).json({ "data": foundElement})
                                                        }
                                                    })
                                                    .catch(err=>{
                                                        console.log(err)
                                                        return res.status(400).send(err)
                                                    })
                      
                                    })
                                    .catch(err =>{
                                        console.log(err);
                                        return res.status(400).send(err)
                                    })
                                }

                                //return res.json({"activity" : foundActivity});

                            });
                        }

                    })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Update Quiz by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Update in quiz by ID"
                }
            })
        })


}




exports.handleAnswers= function (req, res, next) {
    const action = "Update"
    const category = "Answers"
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('id :' + search_id);
    console.log('user', user)
    console.log("valure", req.body)
    //Object.keys(data).forEach(e => console.log(` Activity DATA key=${e}  value=${data[e]}`));
    //Object.keys(req.params).forEach(e => console.log(` req.params DATA key=${e}  value=${req.params[e]}`));
    //Object.keys(req.body).forEach(e => console.log(` req.body DATA key=${e}  value=${req.body[e]}`));

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Question.findById(req.params.id)
                    .exec(function (err, foundElement) {

                        console.log("FOUND ELEMENT:  ", foundElement)
                        if (err) {
                            return res.status(422).send({
                                "action": "Update Quiz by ID ",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": err,
                                    "message": "Update in quiz by ID"
                                }
                            })
                        }
                        else {
                            if (foundElement.created_by != isAuth.id) {
                                return res.status(403).send({
                                    "action": "Patch Quiz by ID ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "You are not the owner"
                                    }
                                })
                            }
                            foundElement.set(data);
                            foundElement.save(function (err) {
                                if (err) {
                                    return res.status(422).send({
                                        "action": "Update Quiz by ID ",
                                        "success": false,
                                        "status": 422,
                                        "error": {
                                            "code": err,
                                            "message": "Update in quiz by ID"
                                        }
                                    })
                                }
                                else {
                                    console.log("NUOVO", foundElement)
                                    message = foundElement._id + " Was Updated successfully"
                                    logs.createLog(action, category, isAuth, message)
                                    res.status(200).json({ "data": foundElement })

                                }

                                //return res.json({"activity" : foundActivity});

                            });
                        }

                    })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Update Quiz by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Update in quiz by ID"
                }
            })
        })


}


exports.deleteQuestion= function (req, res, next) {
    const action = "Delete"
    const category = "Step"

    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Question.findById(req.params.id,
                    function (err, foundQuiz) {
                        if (err) {
                            console.log(err);
                        }
                        if (isAuth.id != foundQuiz.created_by) {
                            return res.status(422).send({
                                "action": "Delete Quiz by ID ",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": "Owner",
                                    "message": "You are not the owner"
                                }
                            })
                        }

                        foundQuiz.remove(function (err) {
                            if (err) {
                                // Delete from teachers
                                return res.status(422).send({
                                    "action": "Delete Quiz by ID ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "Delete in quiz by ID"
                                    }
                                })
                            }
                            foundQuiz.activities.forEach(element => {
                                BaseActivity.findById(element, function (err, foundActivity) {
                                    if (err) {
                                        return res.status(422).send({
                                            "action": "Delete Quiz by ID ",
                                            "success": false,
                                            "status": 422,
                                            "error": {
                                                "code": err,
                                                "message": "Delete in quiz by ID"
                                            }
                                        })
                                    }
                                    foundActivity.quiz.pull(foundQuiz);
                                    foundActivity.save()
                                })
                            });
                            isAuth.questions.pull(foundQuiz)
                            message = foundQuiz._id + " Was Deleted successfully"
                            logs.createLog(action, category, isAuth, message)
                            var counter = isAuth.game_counter.delete_counter + 1

                            gamification.computeAchievement(isAuth,action,counter)
                            .then(achievement=>{
                                console.log("QUI C'è ACHIEVMENT.", achievement)
                                gamification.computeLevel(isAuth)
                                            .then(level=>{
                                                console.log("Level",level)
                                                if(level){
                                                    if(achievement){
                                                        res.status(200).json({ "data": "", "achievement": achievement, "level":level })
                                                    }
                                                }
                                                else if(achievement){
                                                    res.status(200).json({ "data": "", "achievement": achievement })

                                                }
                                                else{
                                                    res.status(200).json({ "data": ""})
                                                }
                                            })
                                            .catch(err=>{
                                                console.log(err)
                                                return res.status(400).send(err)
                                            })
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
                "action": "Add Quiz to Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error adding in quiz in activity"
                }
            })
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