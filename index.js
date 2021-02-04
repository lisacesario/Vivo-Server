const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors')
const config = require('./config/dev');
const FakeDB = require('./FakeDB')
const  http   = require('http');

const formatMessage = require('./controller/messages')

mongoose.connect(config.DB_URI_ASW,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    /*
    const fakeDB = new FakeDB();
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
 

 
 
const admin = require("firebase-admin"); 


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


const PORT = process.env.PORT || 3001;

// Server Setup
var server = http.createServer(app)
server.listen(PORT, function(){
    console.log('listening in http://localhost:' +  PORT)
})

// Socket Setup
const vivoBotSetupCode = 'VivoBot';

const { NotificationVivo } = require('./models/notification');

var io = require('socket.io')(server, {
    cookie:false,
    origins:'*:*',
    pingInterval: 250000,
    pingTimeout: 5000,
    serveClient:true,
    transports:['websocket', 'polling']
})


/* 
    Users is an array composed by:
    - socket 
    - uid
    - displayName
*/

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
})



