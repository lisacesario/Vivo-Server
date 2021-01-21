const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors')
const config = require('./config/dev');
const FakeDB = require('./FakeDB')
const  http   = require('http');

const formatMessage = require('./controller/messages')
//const firebase = require('firebase');
/*****
 * 
 * 
 * 
 * just for test commit
 */

mongoose.connect(config.DB_URI_ASW,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    
   /* const fakeDB = new FakeDB();
     fakeDB.seedDB().catch(error=>{ 
         console.log(error); 
     })*/
     
 }).catch(err => console.log(err));
 mongoose.set('useCreateIndex', true);
 mongoose.set('debug', true);


 const app = express();
 app.use(bodyparser.json());
 app.use(bodyparser.urlencoded({ extended: true }));
 //app.use(multer({storage:fileStorage, fileFilter})).single('image');
 
 app.use(function(req, res, next) {
     res.header("Access-Control-Allow-Origin", "*");
     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
     next();
   });
 app.use(cors());
 

 
 // init firebase
 
const admin = require("firebase-admin"); 

var serviceAccount = require("./config/serviceAccountKey.json");
var VivoDB_URL = "https://inclusivelearning-wecaremore0.firebaseio.com"

var eduServiceAccount = require("./config/vivoEduServiceAccount.json");
var eduDB_URL = "https://vivo-edu.firebaseio.com"


var weceremoreVivo = require("./config/wecaremoreVivoFirebaseAdminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(weceremoreVivo),
  databaseURL: "https://wecaremore-vivo.firebaseio.com"
});

exports.userIsAuth = function(req, res, next) {
    if (req.headers.authtoken) {
      admin.auth().verifyIdToken(req.headers.authtoken)
        .then((decodedToken) => {
          let uid = decodedToken.uid
          console.log(decodedToken)
          next()
        }).catch(() => {
          res.status(403).send('Unauthorized')
        });
    } else {
      res.status(403).send('Unauthorized')
    }
  }

// Init Routes

const userRoutes = require('./routes/users');
app.use('/api/v1/users', userRoutes);
const activitiesRoutes = require('./routes/activities');
app.use('/api/v1/activity', activitiesRoutes);
const quizRoutes = require('./routes/quiz');
app.use('/api/v1/quiz', quizRoutes);
const stepRoutes = require('./routes/steps');
app.use('/api/v1/steps', stepRoutes);
const toolRoutes = require('./routes/tools');
app.use('/api/v1/tools', toolRoutes);

const groupRoutes = require('./routes/groups');
app.use('/api/v1/groups', groupRoutes);
const messagesRoutes = require('./routes/messages');
app.use('/api/v1/messages', messagesRoutes);

const questionRoutes = require('./routes/questions');

const { Notification } = require('./models/notification');
app.use('/api/v1/questions', questionRoutes);

const notificationRoutes = require('./routes/notifications')
app.use('/api/v1/notification', notificationRoutes)

const achievementsRoutes = require('./routes/achievements')
app.use('/api/v1/achievements',achievementsRoutes )

/*
const levelsRoutes = require('./routes/admin-tool/level');
app.use('/api/v1/admin-tools/levels', levelsRoutes);


const achievementsRoutes = require('./routes/admin-tool/achievements');
app.use('/api/v1/admin-tools/achievements', achievementsRoutes);

const adminRoutes = require('./routes/admin-tool/admin-features');
app.use('/api/v1/admin-tools/', adminRoutes);
*/

const PORT = process.env.PORT || 3001;

// Server Setup
var server = http.createServer(app)
server.listen(PORT, function(){
    console.log('listening in http://localhost:' +  PORT)
})


// get username and room from  URL
//const { username, room }

// Socket Setup
const vivoBotSetupCode = 'VivoBot';

const { NotificationVivo } = require('./models/notification');

var io = require('socket.io')(server, {
    transports:['websocket'],
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})

/* 
    Users is an array composed by:
    - socket 
    - uid
    - displayName
*/

// commit schifo
var usersConnected = []

io.on('connection', (socket)=>{

    const socketID = socket.handshake.query 
    console.log("id: ", socketID.token)
    socket.join(socketID.token)

    socket.on('online', function(uid){
        console.log( uid + 'joins the chat')
        usersConnected = usersConnected.filter(x => {return x.uid != uid})
        usersConnected.push({
            'socket': socket,
            'uid':uid
        })
        console.log(usersConnected)
    });

    socket.on('notification', (data)=>{
        var notification = new NotificationVivo({
            'timestamp' :  data.timestamp,
            'type' : data.type,
            'uid_sender': data.uid_sender,
            'uid_receiver': data.uid_receiver,
            'text' : data.text,
            'read': false

        });

        notification.save((err,notification)=>{
            console.log("Salvata", notification.uid_receiver)
            usersConnected.forEach(x => {
                console.log("x: " + x + "socket: " + x.socket +"uid: " + x.uid)
                // Send only if receiver is connected
                if(x.uid == notification.uid_receiver){
                    console.log(x.uid == notification.uid_receiver)
                    io.to(x.socket.id).emit('new:notification', notification)
                    return 
                }
            })
       })
    })



/*
    socket.on('online',(loggedInUser)=>{
        console.log(loggedInUser.displayName + ' joins Vivo')
        users.push({
            'socket': socket,
            'uid': loggedInUser.uid,
            'displayName': loggedInUser.displayName,
        })
        console.log(users)
    })

    socket.on('offline', (loggedInUser) => {
        console.log(loggedInUser.displayName + " will be off Vivo soon")
        this.users = users.filter( x => {return x.uid != loggedInUser.uid})  
    })
  /*  socket.on('offline', function(){
    
        console.log("user " + socket.loggedInUser.displayName + " disconnected")
       // io.emit('user-changed',{user: socket.username, event:'left'})
    });
     * /

   
    socket.on('joinRoom', ({username, room}) =>{
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)
    })

    socket.on('activitycompleted', ({activity, sender, receiver, text})=>{
        var notification = new Notification()
        notification.timedate = new Date()
        notification.type = "ACTIVITY_COMPLETED"
        notification.uid_sender = sender 
        notification.uid_receiver = receiver
        notification.text = text

        notification.save((err,elem)=>{
            if(err){
                console.log(err)
            }
            let index = users.findIndex(user=>{
                return user.uid === receiver.uid
            })
            if(index){
                io.to(users[index].socket).emit('notification', elem)
            }
        })
    })
    
    socket.on('friendshipRequestNew', ({friendshipReq})=>{
        var notification = new Notification()
        notification.timedate = new Date()
        notification.type = "FRIENDSHIP_REQUEST_NEW"
        notification.uid_sender = sender 
        notification.uid_receiver = receiver
        notification.text = text

        notification.save((err,elem)=>{
            if(err){
                console.log(err)
            }
            let index = users.findIndex(user=>{
                return user.uid === receiver.uid
            })
            if(index){
                io.to(users[index].socket).emit('notification', elem)
            }
        })
    })


    socket.on('notiication:friendshipRequestAccepted', ({friendshipReq})=>{
        /*
         -> aggiorno l'agenda 
        * /
    })

    socket.on('notiication:friendshipRequestDeleted', ({friendshipReq})=>{
        /*
         -> aggiorno l'agenda 
        * /
    })

   /* socket.on('join:room', function(chatId){
        console.log('join room: ', chatId)
        socket.join(chatId)
    })

    socket.on('send:chatmessages', function(data){
       var newMessage = new ChatMessage();
       newMessage.chat = data.chatId;
       newMessage.message = data.message;
       newMessage.from = data.from;

       message.save((err,msg)=>{
           io.to(msg.chat).emit('new-message', msg)
       })
    })

   
    socket.on('disconnect', function(){
        console.log("user disconnected")
       // io.emit('user-changed',{user: socket.username, event:'left'})
    });


     // Join room
     socket.on('join', (params, callback)=>{
        console.log(params.user + "join to" + params.room)
        socket.join(params.room);       
        callback()
    })

    // Send Message To Particular Room
    socket.on("chat-message", function(message){
        /* let index = users.findIndex(user=>{
            return user.username === data.username
        })
        console.log('message: ' + data.message)
       users[index].socket.emit("newMessage", {
            message: data.message
        })* /
        console.log(message)
       io.to(message.room).emit('newMessage',{
            message:message.message,
            room:message.room,
            user:message.user
        })
        //io.emit('newMessage', {msg:message.message, user:socket.username})


    })
    
    socket.on('online', function(username){
        console.log( username + 'joins the chat')
        users.push({
            socket,
            username
        })
        console.log(users)
    })
/*
    socket.on('online', function(userDetils ){

    })
    socket.on('set-name', (name)=>{
        socket.username = name
        io.emit('user-changed', {user:name, event:'joined'});
    })

    socket.on('send-message', (message)=>{
        io.emit('message', {msg:message.text, user:socket.name})
    })*/
})



