const mongoose = require('mongoose')
const Schema = mongoose.Schema


const ConversationSchema = new Schema({
    members:[{
        type: Schema.Types.ObjectId,
        ref: 'UserProfile',
    }],
    messages:[{
        type: Schema.Types.ObjectId,
        ref: 'Message',
    }],
    activeFrom:{
        type:Date,
        default: Date.now()
    }
})


const MessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'UserProfile',
    },
    text: {
        type: String,
        required: true
    },
    read :{
        type: Boolean,
        default:false
    },
    read_on:{
        type: Date,
    },
    sent_on: {
        type: Date,
        default: Date.now()
    }
    
})

var Conversation = mongoose.model('Conversation', ConversationSchema)

var Message = mongoose.model('Message', MessageSchema)


module.exports = { Conversation };
