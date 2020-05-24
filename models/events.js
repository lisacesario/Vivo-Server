const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({

    day: { 
        type: Date,
        required:true
    },
    start_time: { 
        type: Date,
        required:true
    },
    end_time: { 
        type: Date,
        required:true
    },
    repeat_weekly: {
        type: Boolean,
        default: false
    },
    repeat_daily: {
        type: Boolean,
        default: false
    },
    repeat_monthly: {
        type: Boolean,
        default: false
    },
    activity: {
        type: Schema.Types.ObjectId,
        ref: 'BaseActivity',
    },
    added_by: {
        type: Schema.Types.ObjectId,
        ref: 'UserProfile',
    },
    added_for: {
        type: Schema.Types.ObjectId,
        ref: 'UserProfile',
    },
    added_at: {
        type: Date,
        default: Date.now,
    },
    executed:{
        done:{
            type: Boolean,
            default: false
        },
        execution_date: {
            type: Date,
            default: false
        },
    }

});



var Event = mongoose.model('Event', EventSchema);

module.exports = { Event };

