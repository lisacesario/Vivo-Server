const { NotificationVivo } = require("../models/notification");
const firebase = require('firebase-admin');
const { UserProfile } = require('../models/user_profile');


exports.getNotificationsById = function(req,res, next){
    
    headers = req.headers;
    //console.log("headers", headers)
    checkIsAuthenticated(headers)
        .then(isAuth =>{
            if(isAuth === false){
                return res.status(403).send("Not auth")
            }
            else{
                NotificationVivo.find({uid_receiver : isAuth._id})
                    .exec()
                    .then(notifications =>{
                        //console.log("nodification", notifications)
                        return res.status(200).send(notifications)
                    })
                    .catch(err =>{
                        return res.status(400).send(err)
                    })
            }
        })    
}

exports.markNotificationAsRead = function(req,res,next){
    NotificationVivo.findById(req.params.id).exec()
        .then(notification=>{
            notification.read = true
            notification.save(function(err){
                if(err){
                    return res.status(400).send(err)
                }
                return res.status(200).send(notification)
            })
        })
}

exports.deleteNotificationById = function(req,res,next){
    NotificationVivo.findById(req.params.id).exec()
        .then(notification=>{
            notification.remove(function(err){
                if(err){
                    return res.status(400).send(err)
                }
                return res.status(200).send({"message": "notifica eliminata"})
            })
    })
}



function checkIsAuthenticated(headers) {

    return new Promise((resolve, reject) => {
        firebase.auth().verifyIdToken(headers.authorization)
            .then(function (decodedToken) {
                let uid = decodedToken.uid
                // //console.log("UDI :", uid)
                UserProfile.findOne({ uid: uid })
                    .exec()
                    .then(foundUser => {
                        //console.log(foundUser)
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