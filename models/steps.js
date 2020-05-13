const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StepSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    description : {
        type:String,
        required:false,
    },
    imgURL: {
        type: String,
        required: false,
    },
    imgSymURL: {
        type: String,
        required: false,
    },
    subject: {
        type: String,
        required: false,
    },
    shared:{
        type: Boolean,
        required: false,
        default:false
    },
    activities:[{
        type: Schema.Types.ObjectId,
        ref: 'BaseActivity'
    }],
    created_at: {
        type: Date,
        default: Date.now,
    },
    created_by:{
        type: Schema.Types.ObjectId,
        ref: 'UserProfile'
    },


});



var Step = mongoose.model('Step', StepSchema);

module.exports = { Step };

