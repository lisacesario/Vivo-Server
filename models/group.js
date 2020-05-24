const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GroupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    },
    partecipants:[{
            type: ObjectId,
            ref: 'UserProfile',
            required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }

})


module.exports = mongoose.model('Group', GroupSchema)