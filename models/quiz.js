const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const QuizSchema = new Schema({

    question: {
        type: String,
        required: true
    },
 /*   option: [{
        text:{
            type:String,
            required:true,
        },
        is_correct:{
            type:Boolean,
            required: true
        }    
    }],*/
    option_1:{
        type:String,
        required:true
    },
    option_2:{
        type:String,
        required:true
    },
    option_3:{
        type:String,
        required:false
    },
    option_4:{
        type:String,
        required:false
    },
    correct_answer:{
        type:String,
        required:true
    },
    subject : {
        type:String,
        required:false,
    },
    imgURL: {
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



var Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = { Quiz };

