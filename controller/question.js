const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Question } = require('../models/question');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, QuizActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const gamification = require('../controller/gamification')

const logs = require('../controller/log');


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

    const { question, imgUrl, environment, shared } = req.body;
    console.log(req.body);
    headers = req.headers


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                const question_data = new Question({
                    'question': question,
                    'imgUrl': imgUrl,
                    'environment': environment,
                    'shared': shared,
                    'created_by': isAuth
                });


                Question.create(question_data, function (err, step) {
                    if (err) {
                        return res.status(400).send(err)
                    }
                    isAuth.exp = isAuth.exp + 10
                    isAuth.game_counter.create_counter = isAuth.game_counter.create_counter + 1;

                    Promise.all([
                        gamification.computeAchievementForCreate(isAuth),
                        gamification.computeLevelCreate(isAuth)
                    ]).then(values => {
                        console.log(values)
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
                            console.log("QUIDNI?=??")

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
                        console.log(err)
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



exports.updateQuestion = function (req, res, next) {
    const action = "Update"
    const category = "Question"
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

                                isAuth.game_counter.update_counter = isAuth.game_counter.update_counter + 1

                                Promise.all([
                                    gamification.computeAchievement(isAuth, isAuth.game_counter.update_counter, "Update"),
                                    gamification.computeLevelCreate(isAuth)
                                ]).then(values => {
                                    console.log(values)
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
                                        console.log("entri=??")

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
                                    console.log(err)
                                    return res.send(err)
                                })


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




exports.handleAnswers = function (req, res, next) {
    const action = "Update"
    const category = "Answers"
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


exports.deleteQuestion = function (req, res, next) {
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
                      isAuth.game_counter.delete_counter = isAuth.game_counter.delete_counter + 1

                            Promise.all([
                                gamification.computeAchievement(isAuth, isAuth.game_counter.delete_counter, "Delete"),
                                gamification.computeLevelCreate(isAuth)
                            ]).then(values => {
                                console.log(values)
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
                                    console.log("entri=??")

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
                                console.log(err)
                                return res.send(err)
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



exports.addQuestionToActivity = function (req, res, next) {
    console.log("AUTH", req.headers)
    console.log("PATCH")
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log("data", req.body)
    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                QuizActivity.findById(search_id).exec()
                    .then(foundElement => {
                        console.log("Found Element: \n", foundElement);
                        if (foundElement.created_by != isAuth.id) {
                            return res.status(403).send({
                                "action": "Add Quiz to Activity",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "message": "You can't add elements in Activity. You are not the owner"
                                }
                            })
                        }
                        Question.findById(data._id).exec()
                            .then(foundQuiz => {
                                console.log(foundQuiz)
                                foundQuiz.activities.push(foundElement);
                                foundElement.questions.push(foundQuiz);
                                foundElement.save(function (err, activity) {
                                    if (err) {
                                        return res.status(400).send(err)
                                    }
                                    foundQuiz.save(function (err, foundQuiz) {
                                        return res.status(200).send(foundQuiz)
                                    })
                                })
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

                    })
                    .catch(err => {
                        return res.status(422).send({
                            "action": "Add Quiz to Activity ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Delete in quiz by ID"
                            }
                        })
                    })
            }

        })
        .catch(err => {
            console.log(err)
        })




}


exports.removeQuestionFromActivity = function (req, res, next) {
    console.log("PATCH")
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
                QuizActivity.findById(search_id).exec()
                    .then(foundElement => {
                        console.log("Found Element: \n", foundElement);
                        Question.findById(data._id).exec()
                            .then(foundQuiz => {
                                console.log(foundQuiz)
                                foundQuiz.activities.pop(foundElement);
                                foundElement.questions.pop(foundQuiz);
                                foundQuiz.save(function (err, quiz) {
                                    foundElement.save(function (err, foundElement) {
                                        return res.status(200).send(foundElement)
                                    })
                                })

                            })
                            .catch(err => {
                                return res.status(422).send({
                                    "action": "Remove Quiz from Activity ",
                                    "success": false,
                                    "status": 422,
                                    "error": {
                                        "code": err,
                                        "message": "Error remove in quiz in activity"
                                    }
                                })
                            })

                    })
                    .catch(err => {
                        return res.status(422).send({
                            "action": "Remove Quiz from Activity ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err,
                                "message": "Remove Quiz from Activity",
                            }
                        })
                    })
            }
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Remove Quiz from Activity ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error remove in quiz in activity"
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