const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const NotificationSchema = new Schema({
    timedate : {
        type: Date,
        required: false
    },
    type : {
        type: String,
        required: true
    },
    uid_sender: {
        type: String,
        required: true
    },
    uid_receiver:{
        type: String,
        required: true
    }

})

var Notification = mongoose.model('Notification', NotificationSchema)
module.exports = {Notification}