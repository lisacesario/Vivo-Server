const jwt = require('jsonwebtoken');
const config = require('../config/dev');
const {Group} = require('../models/group')
const { UserProfile } = require('../models/user_profile');
const normalizeErrors = require('../helpers/mongoose');
const firebase = require('firebase-admin');




exports.getGroupById = function (req, res, next) {
    console.log("GET TOOL BY ID")
    const groupID = req.params.id
    Group.findById(groupID, function (err, foundElement) {
        if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundElement);
    })
}

exports.createGroup = function (req, res, next) {
    console.log("CREATE TOOL")
    const { name } = req.body;

    const group = new Group({
        'name': name
    });


    headers = req.headers;
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("is Auth;", isAuth)
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            else {
                Group.create(group, function (err, newElement) {
                    if (err) {
                        return res.status(422).send({ errors: [{ title: 'Group Creation error', detail: err.errors }] });
                    }

                    newElement.owner = isAuth;
                    isAuth.groups.push(newElement);
                    isAuth.save()
                    newElement.save()

                    return res.status(200).send(newElement)

                })
            }
        })
        .catch(err => {
            return res.status(422).send(
                {
                    "action": "Create Group",
                    "success": false,
                    "status": 400,
                    "error": {
                        "code": err.errors,
                        "message": "Error in create Group"
                    },
                })
        })

}


exports.removeGroup = function(req,res,next){}

exports.addPersonToGroup = function(req,res,next){}
exports.removePersonToGroup = function(req,res,next){}


function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
               // console.log("UDI :", uid)
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