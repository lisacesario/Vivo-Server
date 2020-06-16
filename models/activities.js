const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var options = { discriminatorKey: 'type' }

const BaseActivitySchema = new Schema({

    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:false
    },
    photoURL:{
        type:String,
        required:false,
    },
    type:{
        type:String,
        required:true
    },
    symbolic:{
        type:Boolean,
        default:false
    },
    shared:{
        type:Boolean,
        default:false
    },

    created_at: {
        type: Date,
        default: Date.now,
    },
    created_by:{
        type: Schema.Types.ObjectId,
        ref: 'UserProfile'
    },
    


}, options);


const SelfManagementActivitySchema = new Schema({
    steps: [{
            _id:false,
            position: {type: Number},
            step: {
                type: Schema.Types.ObjectId,
                ref: 'Steps',
            }
        }],
    tools: [{
        type: Schema.Types.ObjectId,
        ref: 'Tool',
        required: false
    }],
}, options)


const QuizActivitySchema = new Schema({
    quiz: [{
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: false
    }],
}, options);



var BaseActivity = mongoose.model('BaseActivity', BaseActivitySchema);
var SelfManagementActivity = BaseActivity.discriminator('SelfManagementActivity', SelfManagementActivitySchema);
var QuizActivity = BaseActivity.discriminator('QuizActivity', QuizActivitySchema);

module.exports = { BaseActivity, SelfManagementActivity, QuizActivity};


