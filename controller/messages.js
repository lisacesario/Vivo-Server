
const { UserProfile } = require('../models/user_profile');
const { Message, Conversation } = require('../models/messages')
const firebase = require('firebase-admin');
const logs = require('../controller/log');


exports.getUserConversations = function (req, res, next) {
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            Conversation.find({ members: isAuth })
                .exec()
                .then(conversations => {
                    return res.status(200).send(conversations)
                })
                .catch(err => {
                    return res.status(422).send({
                        "action": "Get Conversations ",
                        "success": false,
                        "status": 422,
                        "error": {
                            "code": err,
                            "message": "Error in retrieving conversations"
                        }
                    })
                })
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Get Conversations ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in retrieving conversations"
                }
            })
        })
}

exports.getConversationById = function(req,res,next){
    const search_id = req.params.id
    console.log(search_id)
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            Conversation.findById(search_id).populate().exec()
                        .then( conversation =>{
                            return res.status(200).send(conversation)
                        })
                        .catch(err => {
                            return res.status(422).send({
                                "action": "Get Conversations ",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": err,
                                    "message": "Error in retrieving conversations"
                                }
                            })
                        })
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Get Conversations ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in retrieving conversations"
                }
            })
        })
}


exports.getMessageFromId = function (req, res, next) {
    const search_id = req.params.id
    console.log(search_id)
    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            Message.findById(search_id)
                .exec()
                .then(message => {
                    return res.status(200).send(message)
                })
                .catch(err => {
                    return res.status(422).send({
                        "action": "Get Message by ID ",
                        "success": false,
                        "status": 422,
                        "error": {
                            "code": err,
                            "message": "Error in retrieving message"
                        }
                    })
                })
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Get Message by ID ",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in retrieving message"
                }
            })
        })

}


exports.createConversation = function (req, res, next) {
    const { partecipant } = req.body;

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }
            const conversation = new Conversation();
            Conversation.create(conversation).exec()
                .then(newConversation => {
                    UserProfile.findById(partecipant).exec()
                        .then(person => {
                            newConversation.members.push(person)
                            newConversation.members.push(isAuth)
                            newConversation.save()
                            return res.status(200).send(newConversation)
                        })
                        .catch(err => {
                            return res.status(422).send({
                                "action": "Create Conversation",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": err,
                                    "message": "Error in create conversation"
                                }
                            })
                        })
                })
                .catch(err => {
                    return res.status(422).send({
                        "action": "Create Conversation",
                        "success": false,
                        "status": 422,
                        "error": {
                            "code": err,
                            "message": "Error in create conversation"
                        }
                    })
                })
        })
        .catch(err => {
            return res.status(422).send({
                "action": "Create Conversation",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in create conversation"
                }
            })
        })
}


exports.createMessage = function (req, res, next) {
    const search_id = req.params.id
    console.log(search_id)
    const { text } = req.body;

    headers = req.headers
    checkIsAuthenticated(headers)
        .then((isAuth) => {
            console.log("isauth?")
            if (isAuth === false) {
                return res.status(403).send("You are not authorized")
            }

            const message = new Message({
                'from': isAuth,
                'text': text
            })

            Message.create(message).exec()
                .then(newMessage => {
                    Conversation.findById(search_id).exec()
                        .then(foundConversation => {
                            foundConversation.messages.push(newMessage)
                            foundConversation.save()
                            return res.status(200).send(newMessage)
                        })
                        .catch(err => {
                            return res.status(422).send({
                                "action": "Create Message",
                                "success": false,
                                "status": 422,
                                "error": {
                                    "code": err,
                                    "message": "Error in create message"
                                }
                            })
                        })
                })
                .catch(err => {
                    return res.status(422).send({
                        "action": "Create Message",
                        "success": false,
                        "status": 422,
                        "error": {
                            "code": err,
                            "message": "Error in create message"
                        }
                    })
                })



        })
        .catch(err => {
            return res.status(422).send({
                "action": "Create Message",
                "success": false,
                "status": 422,
                "error": {
                    "code": err,
                    "message": "Error in create message"
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