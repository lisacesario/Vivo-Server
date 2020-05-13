const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Step } = require('../models/steps');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, SelfManagementActivity } = require('../models/activities');
//const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');


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
    console.log("CREATE Step")
    const { name, description, shared, imgUrl, imgSym, created_by, activity, subject } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const step = new Step({
        'name': name,
        'description': description,
        'imgUrl': imgUrl,
        'imgSym': imgSym,
        'shared': shared,
        'subject': subject,

        // 'activities' : activities
    });


    Step.create(step, function (err, newElement) {
        if (err) {
            return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
        }
        console.log("Elemento: ", newElement)

        UserProfile.find({ uid: created_by }, function (err, foundUser) {
            if (err) {
                return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
            }
            console.log(foundUser[0])

        }).then((foundUser) => {
            foundUser[0].tools.push(newElement)
            foundUser[0].save()
            newElement.created_by = foundUser[0]
            newElement.save()
        })
            .catch(err => { console.log(err) })

        console.log("activity:", newElement.activities.length);
        if (newElement.activities.length != 0) {
            if (newElement.activities !== null || newElement.activities.length > 0) {
                SelfManagementActivity.findById(newElement.activities[0], function (err, foundActivity) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    console.log(foundActivity)
                    let just_a_step = {
                        'position': 0,
                        'step': newElement
                    }
                    foundActivity.steps.push(just_a_step)
                    foundActivity.save()
                })


            }
        }



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

    Step.findById(req.params.id)
        .populate()
        .exec(function (err, foundElement) {
            console.log("FOUND ELEMENT:  ", foundElement)
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
                        console.log("NUOVO", foundElement)
                        return res.status(200).json(foundElement);
                    }

                });
            }

        })
}



exports.deleteStep = function (req, res, next) {
    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)
    Step.findById(req.params.id,
        function (err, foundStep) {
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

                    if (foundUser[0].id != foundStep.created_by) {
                        return res.status(422).send({ errors: [{ title: 'Invalid user', detail: 'you are not the owner' }] });
                    }


                    foundStep.remove(function (err) {
                        if (err) {
                            // Delete from teachers
                            return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });

                        }
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
                        foundUser[0].steps.pull(foundStep)
                        foundUser[0].save()
                        return res.json({ "status": "deleted" });
                    });
                })

            })
                .catch(err => console.log(err))

        });
}


exports.addStepToActivity = function (req, res, next) {
    console.log("Add Step from Activity")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)


    SelfManagementActivity.findById(search_id).populate().exec(function (err, foundElement) {

        if (err) {
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        console.log("Found Element: /n", foundElement);


        Step.findById(data._id)
            .populate()
            .exec(function (err, foundStep) {
                if (err) {
                    console.log("sono bloccato in quetsto errore");
                    console.log("i miei errori sono qui:", err.errors);
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                else {

                    foundStep.activities.push(foundElement);
                    foundStep.save()
                    foundElement.tools.push(foundTool);
                    foundElement.save();
                    return res.status(200).send({ "message": "Step inserito correttamente" })
                }
            })

    })




    /* }).then(foundElement =>{
         
     })*/


}


exports.removeToolFromActivity = function (req, res, next) {
    console.log("Remove Tool from Activity")
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)


    SelfManagementActivity.findById(search_id).populate().exec(function (err, foundElement) {

        if (err) {
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        console.log("Found Element: /n", foundElement);
        Tool.findById(data._id)
            .populate()
            .exec(function (err, foundTool) {
                if (err) {
                    console.log("sono bloccato in quetsto errore");
                    console.log("i miei errori sono qui:", err.errors);
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                else {

                    foundTool.activities.pop(foundElement);
                    foundTool.save()
                    console.log("pop")
                    foundElement.tools.pop(foundTool);
                    foundElement.save()

                }

            })
    })
    /* }).then(foundElement =>{
         
     })*/


}


exports.changeOrder = function(req,res,next){
    console.log('activity_id :' + search_id);
    console.log('user', user)
    console.log("data", req.body)
}