const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ContactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    note: {
        type: String,
        required: true
    },
    addedBy: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }

})


module.exports = mongoose.model('Contact', ContactSchema)