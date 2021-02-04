const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Tool } = require('../models/tools');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, SelfManagementActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');
const logs = require('../controller/log');
const gamification = require('../controller/gamification')


exports.getTools = function (req, res, next) {
    Tool.find({}, function (err, foundElement) {
        if (err) {
            return res.status(400).send(err)
        }
        return res.json(foundElement);
    })
}


exports.getToolsById = function (req, res, next) {
    const toolID = req.params.id
    Tool.findById(toolID, function (err, foundElement) {
        if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundElement);
    })
}

exports.createTool = function (req, res, next) {

    const { name, imgUrl, description, shared, activities, warning } = req.body;

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                const tool_data = new Tool({
                    'name': name,
                    'imgUrl': imgUrl,
                    'description': description,
                    'shared': shared,
                    'warning': warning,
                    'created_by': isAuth
                });


                Tool.create(tool_data, function (err, tool) {
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

                            if (err) {
                                res.status(400).send(err)
                            }
                            if (level && achievement) {
                                return res.status(200).send({ "data": tool, "achievement": achievement, "level": level })

                            }
                            else if (level) {
                                return res.status(200).send({ "data": tool, "level": level })


                            }
                            else if (achievement) {
                                return res.status(200).send({ "data": tool, "achievement": achievement })


                            }
                            else {
                                return res.status(200).send({ "data": tool })


                            }
                        })
                    }).catch(err => {
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



exports.updateTool = function (req, res, next) {
    const action = "Update"
    const category = "Tools"

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
                Tool.findById(req.params.id).exec(function (err, foundElement) {
                    if (err) {
                        return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    }
                    if (foundElement.created_by != isAuth.id) {
                        return res.status(403).json("You are not the owner")
                    }
                    foundElement.set(data);
                    foundElement.save(function (err) {
                        if (err) {

                            return res.status(422).send({ errors: [{ title: 'Error in save  activity', detail: err.errors }] });
                        }
                        isAuth.game_counter.update_counter = isAuth.game_counter.update_counter + 1

                        Promise.all([
                            gamification.computeAchievement(isAuth, isAuth.game_counter.update_counter, "Update"),
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
                            return res.send(err)
                        })


                    });
                })
            }
        })
        .catch(err => {
            return res.status(400).send(err)
        })

}




exports.deleteTool = function (req, res, next) {
    const action = "Delete"
    const category = "Tools"

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Tool.findById(req.params.id,
                    function (err, foundElement) {
                        if (err) {
                            return res.status(400).send(err)
                        }

                        if (foundElement.created_by != isAuth.id) {
                            return res.status(403).send("You are not authorized")
                        }
                        foundElement.remove(function (err) {
                            if (err) {
                                return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });

                            }
                            foundElement.activities.forEach(element => {
                                SelfManagementActivity.findById(element, function (err, foundActivity) {
                                    if (err) {
                                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                                    }
                                    foundActivity.tool.pull(foundElement);
                                    foundActivity.save()
                                })
                            });
    
                            isAuth.game_counter.delete_counter = isAuth.game_counter.delete_counter + 1

                            Promise.all([
                                gamification.computeAchievement(isAuth, isAuth.game_counter.delete_counter, "Delete"),
                                gamification.computeLevelCreate(isAuth)
                            ]).then(values => {
                                ////console.log(values)
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
                                    ////console.log("entri=??")

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
                                ////console.log(err)
                                return res.send(err)
                            })
                        })
                    })
            }

        })
        .catch(err => {
            return res.status(400).send(err)
        })

}

exports.addToolToActivity = function (req, res, next) {
    const action = "Add"
    const category = "Tools"

    const data = req.body;
    const search_id = req.params.id

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {

                SelfManagementActivity.findById(search_id).exec()
                    .then(foundElement => {
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
                        Tool.findById(data._id).exec()
                            .then(tool => {
                                tool.activities.push(foundElement);
                                tool.save()

                                foundElement.tools.push(tool);
                                foundElement.save()
                                message = "Tool " + tool._id + " was added to " + foundElement._id
                                logs.createLog(action, category, isAuth, message)
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
            return res.status(400).send(err)
        })




}


exports.removeToolFromActivity = function (req, res, next) {
    const action = "Remove"
    const category = "Tools"
    const user = res.locals.user;
    const data = req.body;
    const search_id = req.params.id

    headers = req.headers;
    checkIsAuthenticated(headers)
        .then(isAuth => {
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                SelfManagementActivity.findById(search_id).populate().exec(function (err, foundElement) {

                    if (err) {
                            return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    }
                    Tool.findById(data._id)
                        .exec(function (err, foundTool) {
                            if (err) {
                                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                            }
                            else {

                                foundTool.activities.pop(foundElement);
                                foundTool.save()
                                foundElement.tools.pop(foundTool);
                                foundElement.save()
                                message = "Tool " + foundTool._id + " was removed from " + foundElement._id
                                logs.createLog(action, category, isAuth, message)

                                return res.status(200).send({ "status": "ok" })

                            }

                        })
                })
            }
        })



}



function checkIsAuthenticated(headers) {
    //console.log(headers)
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
                        reject(err)
                    })
            })
            .catch(err => {
                reject(err)
            })
    })

}