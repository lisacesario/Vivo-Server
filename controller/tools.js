const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { Tool } = require('../models/tools');
const { UserProfile } = require('../models/user_profile');
const { BaseActivity, SelfManagementActivity } = require('../models/activities');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');


// da modificare col parametro shared
exports.getTools = function (req, res, next) {
    console.log("GET TOOL ")
    Tool.find({}, function (err, foundElement) {
        if (err) {
            console.log(err);
        }
        // console.log(foundElement)
        return res.json(foundElement);
    })
}


exports.getToolsById = function (req, res, next) {
    console.log("GET TOOL BY ID")
    const toolID = req.params.id
    // console.log(toolID)
    Tool.findById(toolID, function (err, foundElement) {
        if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundElement);
    })
}

exports.createTool = function (req, res, next) {
    console.log("CREATE TOOL")
    const { name, imgUrl, description, shared, created_by, activities, warning } = req.body;
    //console.log(req.file);

    console.log("my body", req.body);

    const tool = new Tool({
        'name': name,
        'description': description,
        'imgUrl': imgUrl,
        'warning': warning,
        'shared': shared,
        'activities': activities
    });


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Tool.create(tool, function (err, newElement) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }

                    newElement.created_by = isAuth;
                    isAuth.tools.push(newElement);
                    isAuth.save()
                    newElement.save()

                    return res.status(200).send(newElement)

                })
            }
        })
        .catch(err => {
            return res.status(422).send(
                {
                    "action": "Create Tool",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in create Tool"
                    },
                })
        })

}



exports.updateTool = function (req, res, next) {
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
                            console.log("sono solo  qui ");

                            return res.status(422).send({ errors: [{ title: 'Error in save  activity', detail: err.errors }] });
                        }
                        else {
                            console.log("NUOVO", foundElement)
                            return res.status(200).json(foundElement);
                        }


                    });
                })
            }
        })
        .catch(err => {
            return res.status(400).send(err)
        })

}




exports.deleteTool = function (req, res, next) {
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
                Tool.findById(req.params.id,
                    function (err, foundElement) {
                        if (err) {
                            console.log(err);
                        }

                        if (foundElement.created_by != isAuth.id) {
                            return res.status(403).send("You are not authorized")
                        }
                        foundElement.remove(function (err) {
                            if (err) {
                                // Delete from teachers
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
                            isAuth.tools.pull(foundElement)
                            isAuth.save()
                            return res.json({ "status": "deleted" });
                        })
                    })
            }

        })
        .catch(err => {

        })

}

exports.addToolToActivity = function (req, res, next) {
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
                                console.log(tool)
                                tool.activities.push(foundElement);
                                tool.save()

                                foundElement.tools.push(tool);
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