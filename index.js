const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors')
const config = require('./config/dev');
const FakeDB = require('./FakeDB')
//const firebase = require('firebase');
/*****
 * 
 * 
 * 
 * just for test commit
 */

mongoose.connect(config.DB_URI_ASW,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    /*
    const fakeDB = new FakeDB();
     fakeDB.seedDB().catch(error=>{ 
         console.log(error); 
     })
     */
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

admin.initializeApp({
  credential: admin.credential.cert(eduServiceAccount),
  databaseURL: "https://vivo-edu.firebaseio.com"
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
app.use('/api/v1/questions', questionRoutes);
/*
const levelsRoutes = require('./routes/admin-tool/level');
app.use('/api/v1/admin-tools/levels', levelsRoutes);


const achievementsRoutes = require('./routes/admin-tool/achievements');
app.use('/api/v1/admin-tools/achievements', achievementsRoutes);

const adminRoutes = require('./routes/admin-tool/admin-features');
app.use('/api/v1/admin-tools/', adminRoutes);
*/

const PORT = process.env.PORT || 3001;

app.listen(PORT, function(){
    console.log('i am running')
});

