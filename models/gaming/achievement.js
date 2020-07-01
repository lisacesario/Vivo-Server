const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AchievementSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    action:{
        type:String,
        required:true,
    },
    required_point:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required: true
    },
    imgUrl:{
        type: String, 
        required: true
    },
    points:{
        type:Number, 
        required:true
    }
})

var Achievement = mongoose.model('Achievement', AchievementSchema);

module.exports = { Achievement };

