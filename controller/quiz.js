const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Quiz } = require('../models/quiz');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity ,QuizActivity} = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');


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
        .then(foundQuiz =>{
            return res.status(200).send(foundQuiz)
        })
        .catch(err =>{
            return res.status(422).send({
                "action": "Get Quiz by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err.errors,
                    "message": "Error in quiz by ID"
                }
            })
        })
}


exports.getQuizFromActivity =  function (req,res, next){
    console.log("GET QUIZ FROM ACTIVITY");
    const activity_id = req.params.id;
    console.log(activity_id)
    QuizActivity.findById(activity_id, function(err,foundActivity){
        if(err){
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        temporary_array = []
        foundActivity.quiz.forEach(element => {
            Quiz.findById(element, function(err, foundQuiz){
                if (err) {
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                temporary_array.push(foundQuiz)
                console.log("bu", temporary_array)
            })
        });
        console.log("sono uscito dai cicli", temporary_array)
        return res.json(foundActivity.quiz);
    })
}

exports.createQuiz = function (req, res, next) {
    console.log("CREATE QUIZ")
    const { question, imgUrl, subject, correct_answer, option_1, option_2,option_3, option_4, created_by, activities } = req.body;
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
        'activities' : activities
    });


    Quiz.create(quiz, function (err, newQuiz) {
        if (err) {
            return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
        }

        UserProfile.find({ uid: created_by }, function (err, foundUser) {
            if (err) {
                return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
            }
            console.log(foundUser[0])

        }).then((foundUser) => {
            foundUser[0].quizzes.push(quiz)
            foundUser[0].save()
            newQuiz.created_by = foundUser[0]
            newQuiz.save()
        })
            .catch(err => { console.log(err) })

        console.log("activity:", newQuiz.activities.length);
        if(newQuiz.activities.length != 0){
            if (newQuiz.activities !== null || newQuiz.activities.length > 0) {
                QuizActivity.findById(newQuiz.activities[0], function (err, foundActivity) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    console.log(foundActivity)
                    foundActivity.quiz.push(newQuiz)
                    foundActivity.save()
                })
    
    
            }
        }
        


    })


}



exports.updateQuiz = function(req,res,next){
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

    Quiz.findById(req.params.id).populate().exec(function(err,foundElement){
                   // .populate()
                   // .exec(function(err, foundElement){
                        console.log("FOUND ELEMENT:  ", foundElement)
                        if(err){
                            console.log("sono bloccato in quetsto errore");
                            console.log("i miei errori sono qui:", err.errors);
                            return res.status(422).send({errors: normalizeErrors(err.errors)});
                        }
                        else{ 
                           /* if(foundElement[0].created_by != user){
                                console.log("created by ", foundElement.uid );
                                console.log("hser ",search_id);
                                console.log("sono bloccato");
                                //return res.status(422).send({errors: normalizeErrors(err.errors)});
                                return res.status(422).send({errors: [{title:'Invalid user', detail:'you are not the owner'}]});
                            } */ 
                            
                            foundElement.set(data);
                            foundElement.save(function(err){
                                if(err){
                                    console.log("sono solo  qui ");

                                    return res.status(422).send({errors: [{title:'Error in save  activity', detail: err.errors}]});
                                }
                                else{
                                    console.log("NUOVO", foundElement)
                                    return res.status(200).json(foundElement);
                                }
                                
                                //return res.json({"activity" : foundActivity});
                                
                            });
                        }
                     
                    })
}



exports.deleteQuiz = function (req, res, next) {
    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)
    Quiz.findById(req.params.id, 
        function (err, foundQuiz) {
            if (err) {
                console.log(err);
            }

            //console.log("che senso ha tutto questo?",foundQuiz)
            firebase.auth().verifyIdToken(req.headers.authorization).then(function (decodedToken) {
                let uid = decodedToken.uid
                console.log("UDI", uid)
                //console.log("CREATED_BY:", foundQuiz.created_by)

                UserProfile.find({ uid: uid }, function (err, foundUser) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    console.log(foundUser[0].id)

                    if (foundUser[0].id != foundQuiz.created_by) {
                        return res.status(422).send({ errors: [{ title: 'Invalid user', detail: 'you are not the owner' }] });
                    }
                
    
                    foundQuiz.remove(function (err) {
                        if (err) {
                            // Delete from teachers
                            return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });
        
                        }
                        foundQuiz.activities.forEach(element => {
                            BaseActivity.findById(element, function(err, foundActivity){
                                if(err){
                                    return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                                }
                                foundActivity.quiz.pull(foundQuiz);
                                foundActivity.save()
                            })
                        });
                        foundUser[0].quizzes.pull(foundQuiz)
                        foundUser[0].save()
                        return res.json({ "status": "deleted" });
                    });
                })
                
            })
            .catch(err => console.log(err))
    
        });
    }

exports.addQuizToActivity = function(req,res,next){
    console.log("PATCH")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)


    QuizActivity.findById(search_id).populate().exec(function(err, foundElement){

        if(err){
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        console.log("Found Element: /n", foundElement);

        
        Quiz.findById(data._id)
            .populate()
            .exec( function(err,foundQuiz){
                if(err){
                    console.log("sono bloccato in quetsto errore");
                    console.log("i miei errori sono qui:", err.errors);
                    return res.status(422).send({errors: normalizeErrors(err.errors)});
                }
                else{
                    
                    foundQuiz.activities.push(foundElement);
                    foundQuiz.save()
                    foundElement.quiz.push(foundQuiz); 
                    foundElement.save();
                    return res.status(200).send({"message": "Quiz inserito correttamente"})
                }
            })
           
        })
       

    
    
   /* }).then(foundElement =>{
        
    })*/
    

}


exports.removeQuizFromActivity = function(req,res,next){
    console.log("PATCH")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)


    QuizActivity.findById(search_id).populate().exec(function(err, foundElement){

        if(err){
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        console.log("Found Element: /n", foundElement);
        Quiz.findById(data._id)
        .populate()
        .exec( function(err,foundQuiz){
            if(err){
                console.log("sono bloccato in quetsto errore");
                console.log("i miei errori sono qui:", err.errors);
                return res.status(422).send({errors: normalizeErrors(err.errors)});
            }
            else{
                
                foundQuiz.activities.pop(foundElement);
                foundQuiz.save()
                console.log("pop")
                foundElement.quiz.pop(foundQuiz);
                foundElement.save()
    
            }

        })
    })
   /* }).then(foundElement =>{
        
    })*/
    

}