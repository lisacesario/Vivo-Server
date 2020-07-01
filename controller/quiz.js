const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Quiz } = require('../models/quiz');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, QuizActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const logs = require('./log')

// da modificare col parametro shared
exports.getQuiz = function (req, res, next) {
    console.log("GET QUIZ")
    Quiz.find({}, function (err, foundQuiz) {
        if (err) {
            console.log(err);
        }
        return res.json(foundQuiz);
    })
}

exports.getQuizById = function (req, res, next) {
    console.log("GET BY ID QUIZ")
    const quizId = req.params.id
    console.log(quizId)
    Quiz.findById(quizId)
        .exec()
        .then(foundQuiz => {
            return res.status(200).send(foundQuiz)
        })
        .catch(err => {
           
            return res.status(422).send({
                "action": "Get Quiz by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in quiz by ID"
                }
            })
        })
}



exports.createQuiz = function (req, res, next) {
    console.log("CREATE QUIZ")
    const { question, imgUrl, subject, correct_answer, option_1, option_2, option_3, option_4, created_by, activities } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const quiz = new Quiz({
        'question': question,
        'imgUrl': imgUrl,
        'subject': subject,
        'correct_answer': correct_answer,
        'option_1': option_1,
        'option_2': option_2,
        'option_3': option_3,
        'option_4': option_4,
        'activities': activities
    });

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
                Quiz.create(quiz, function (err, newQuiz) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    newQuiz.created_by = isAuth
                    isAuth.quizzes.push(newQuiz)
                    isAuth.save();
                    newQuiz.save();
                    return res.status(200).send(newQuiz)
                })
                
            }
        })
        .catch(err=>{
            return res.status(400).send(err)
        })

}



exports.updateQuiz = function (req, res, next) {
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

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else{
                Quiz.findById(req.params.id)
                    .exec(function (err, foundElement) {

                    console.log("FOUND ELEMENT:  ", foundElement)
                    if (err) {
                        console.log("sono bloccato in quetsto errore");
                        console.log("i miei errori sono qui:", err.errors);
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
                        if(foundElement.created_by != isAuth.id){
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
                                return res.status(200).json(foundElement);
                            }
            
                            //return res.json({"activity" : foundActivity});
            
                        });
                    }
            
                })
            }
        })
        .catch(err =>{
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



exports.deleteQuiz = function (req, res, next) {
    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Quiz.findById(req.params.id,
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
                            isAuth.quizzes.pull(foundQuiz)
                            isAuth.save()
                            return res.status(200).json({ "status": "deleted" });
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


exports.addQuizToActivity = function (req, res, next) {
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
                        Quiz.findById(data._id).exec()
                            .then(foundQuiz => {
                                console.log(foundQuiz)
                                foundQuiz.activities.push(foundElement);
                                foundQuiz.save()
                                console.log("found quiz saved")
                                foundElement.quiz.push(foundQuiz);
                                foundElement.save()
                                console.log("FoundActivity saved")
                                return res.status(200).send(foundElement)
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


exports.removeQuizFromActivity = function (req, res, next) {
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
                        Quiz.findById(data._id).exec()
                            .then(foundQuiz => {
                                console.log(foundQuiz)
                                foundQuiz.activities.pop(foundElement);
                                foundQuiz.save()
                                console.log("found quiz saved")
                                foundElement.quiz.pop(foundQuiz);
                                foundElement.save()
                                console.log("FoundActivity saved")
                                return res.status(200).send(foundElement)
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