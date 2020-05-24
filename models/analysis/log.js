const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { ObjectId } = Schema

const LogSchema = new Schema({
    action: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    createdBy: {
        type: ObjectId,
        ref: 'UserProfile',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }

})

LogSchema.index({ action: 1, category: 1 })

module.exports = mongoose.model('Log', LogSchema)