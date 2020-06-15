const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const QuestionSchema = new Schema({

    question: {
        type: String,
        required: true
    },
    answers:[
        { 
            _id:false, 
            text: {type:String, required:true},
            correct: {type:Boolean, required:false},
            value: {type:Number, required:false}
    }],
    environment : {
        type:String,
        required:false,
    },
    imgURL:{
        type: String,
        required: false,
    },
    shared:{
        type: Boolean,
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



var Question = mongoose.model('Question', QuestionSchema);

module.exports = { Question };

