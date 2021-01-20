const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const NotificationSchema = new Schema({
    timestamp : {
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
    },
    text:{
        type:String,
        required: false
    },
    read:{
        type:String,
        required: false,
        default: false
    }

})

var NotificationVivo = mongoose.model('NotificationVivo', NotificationSchema)
module.exports = {NotificationVivo}