const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const { BaseActivity } = require('../models/activities');
const { UserProfile, TeacherProfile } = require('../models/user_profile');
const firebase = require('firebase-admin');
const normalizeErrors = require('../helpers/mongoose');


// da modificare col parametro shared
exports.getActivity = function (req, res, next) {
    console.log("GET ACTIVITY")
    BaseActivity.find()
                .exec()
                .then(foundActivities =>{
                    return res.status(200).send(foundActivities)
                })
                .catch(err=>{
                    return res.status(422).send(
                        {
                            "action": "Get Activities ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in retrieving activities"
                            }
                        }
                    )
                })
}



exports.getActivityByID = function (req, res, next) {
    console.log("GET BY ID ACTIVITY")
    const attivitaId = req.params.id
    BaseActivity.findById(attivitaId)
                .exec()
                .then(foundActivity => {
                    return res.status(200).send(foundActivity)
                })
                .catch(err => {
                    return res.status(422).send(
                        {
                            "action": "Get Activity by ID ",
                            "success": false,
                            "status": 422,
                            "error": {
                                "code": err.errors,
                                "message": "Error in retrieving activity"
                            }
                        }
                    )
               
    })
}

exports.createActivity = function (req, res, next) {
    console.log("CREATE ACTIVITY")
    const { name, photoURL, description, type, shared, created_by } = req.body;
    //console.log(req.file);

    console.log(req.body);

    const activity = new BaseActivity({
        'name': name,
        'photoURL': photoURL,
        'description': description,
        'type': type,
        'shared': shared,
        'likes': 0,

    });


    BaseActivity.create(activity, function (err, newObj) {
        if (err) {
            return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
        }

        UserProfile.findOne({ uid: created_by }, function (err, foundUser) {
            if (err) {
                return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
            }
            console.log(" u:" , foundUser)
            return foundUser
        }).then((foundUser) => {
            console.log(foundUser)
            foundUser.activities.push(newObj);
            foundUser.save()
            activity.created_by = foundUser
            activity.save()
        }).catch(err => { console.log(err) })

    })


}
/*
UserProfile.find({uid : created_by}).exec(
    function(err,foundUser){
        if(err){
            return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        return foundUser
    })
    .then( (foundUser)=>{
        console.log(foundUser)

        const new_activity = new BaseActivity({
            'name': name,
            'photoURL': imgUrl,
            'description': description, 
            'type':type, 
            'shared':shared, 
            'likes':0,
        });
        new_activity.created_by = foundUser
        //new_activity.created_by = foundUser
        //console.log("data", new_activity) ; 
        
        console.log(new_activity)

        BaseActivity.create(new_activity, function(err, newObj){
            
            if(err){
                return res.status(422).send({errors: [{title:'Base Activity Error', detail:err.errors}]});
            }
            //foundUser.activities.push(newObj)
            //foundUser.save()
            newObj.save()
            /*UserProfile.update({ uid: newObj.created_by }, {$push: { activities : newObj}}, function(){}).catch((err)=>{
                return res.status(422).send({errors: [{title:'Huston we have a problem', detail:err.errors}]});
            });* /
            
            return res.json(newObj);
        })

    }
   // })


/*  UserProfile.find({uid : created_by}).exec(
    function(err,foundUser){
        if(err){
            return res.status(422).send({errors: normalizeErrors(err.errors)});
        }
        
        */

//) 

//}

exports.updateActivity = function (req, res, next) {
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

    BaseActivity.findById(req.params.id).populate().exec(function (err, foundElement) {
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
             }*/

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


exports.deleteActivity = function (req, res, next) {
    console.log("AUTH", req.headers)


    BaseActivity.findById(req.params.id)
        .populate()
        .exec(function (err, foundActivity) {
            if (err) {
                console.log(err);
            }

            console.log("found act ",foundActivity)
            firebase.auth().verifyIdToken(req.headers.authorization).then(function (decodedToken) {
                let uid = decodedToken.uid
                console.log("UDI", uid)
                console.log("CREATED_BY:", foundActivity.created_by)

                UserProfile.find({ uid: uid }, function (err, foundUser) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Base Activity Error', detail: err.errors }] });
                    }
                    console.log("HO TROVATO L'UTENTE?" ,foundUser[0].id)

                    if (foundUser[0].id != foundActivity.created_by) {
                        return res.status(422).send({ errors: [{ title: 'Invalid user', detail: 'you are not the owner' }] });
                    }
    
                    foundActivity.remove(function (err) {
                        if (err) {
                            // Delete from teachers
                            return res.status(422).send({ errors: [{ title: 'Error Remove', detail: 'there was an error removing' }] });
        
                        }
                        foundUser[0].activities.pull(foundActivity)
                        foundUser[0].save()
                        return res.json({ "status": "deleted" });
                    });
                })
                
            })
            .catch(err => console.log(err))
    
        });






}

