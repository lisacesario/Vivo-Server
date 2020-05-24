const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AchievementSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    imgUrl:{
        type: String, 
        required: true
    },
    value:{
        type:String, 
        required:true
    }
})

var Achievement = mongoose.model('Achievement', AchievementSchema);

module.exports = { Achievement };

