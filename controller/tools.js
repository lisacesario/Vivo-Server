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
        console.log(foundElement)
        return res.json(foundElement);
    })
}


exports.getToolsById = function (req, res, next) {
    console.log("GET TOOL BY ID")
    const toolID = req.params.id
    console.log(toolID)
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

    console.log(req.body);

    const tool = new Tool({
        'name': name,
        'imgUrl': imgUrl,
        'description': description,
        'shared': shared,
        'warning': warning
        // 'activities' : activities
    });


    Tool.create(tool, function (err, newElement) {
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
                    foundActivity.tools.push(newElement)
                    foundActivity.save()
                })


            }
        }



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

    Tool.findById(req.params.id).populate().exec(function (err, foundElement) {
        // .populate()
        // .exec(function(err, foundElement){
        console.log("FOUND ELEMENT:  ", foundElement)
        if (err) {
            console.log("sono bloccato in quetsto errore");
            console.log("i miei errori sono qui:", err.errors);
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        else {
            /* if(foundElement[0].created_by != user){
                 console.log("created by ", foundElement.uid );
                 console.log("hser ",search_id);
                 console.log("sono bloccato");
                 //return res.status(422).send({errors: normalizeErrors(err.errors)});
                 return res.status(422).send({errors: [{title:'Invalid user', detail:'you are not the owner'}]});
             } */

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

                //return res.json({"activity" : foundActivity});

            });
        }
    })
}



exports.deleteTool = function (req, res, next) {
    console.log("AUTH", req.headers)
    console.log("ID ", req.params.id)
    Tool.findById(req.params.id,
        function (err, foundElement) {
            if (err) {
                console.log(err);
            }

            firebase.auth().verifyIdToken(req.headers.authorization).then(function (decodedToken) {
                let uid = decodedToken.uid
                console.log("UDI", uid)

                UserProfile.find({ uid: uid }, function (err, foundUser) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    console.log(foundUser[0].id)

                    if (foundUser[0].id != foundElement.created_by) {
                        return res.status(422).send({ errors: [{ title: 'Invalid user', detail: 'you are not the owner' }] });
                    }


                    foundElement.remove(function (err) {
                        if (err) {
                            // Delete from teachers
                            return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });

                        }
                        foundElement.activities.forEach(element => {
                            BaseActivity.findById(element, function (err, foundActivity) {
                                if (err) {
                                    return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                                }
                                foundActivity.tool.pull(foundElement);
                                foundActivity.save()
                            })
                        });
                        foundUser[0].tools.pull(foundElement)
                        foundUser[0].save()
                        return res.json({ "status": "deleted" });
                    });
                })

            })
                .catch(err => console.log(err))

        });
}



exports.addToolToActivity = function (req, res, next) {
    console.log("Add Tool from Activity")
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

                    foundTool.activities.push(foundElement);
                    foundTool.save()
                    foundElement.tools.push(foundTool);
                    foundElement.save();
                    return res.status(200).send({ "message": "Quiz inserito correttamente" })
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