const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GroupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'UserProfile',
    },
    partecipants:[{
            type: Schema.Types.ObjectId,
            ref: 'UserProfile',
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }

})

var Group = mongoose.model('Group', GroupSchema)


module.exports = { Group };
