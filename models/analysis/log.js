const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VivoLogSchema = new Schema({
    action: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
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

VivoLogSchema.index({ action: 1, category: 1 })

module.exports = mongoose.model('VivoLog', VivoLogSchema)