const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const LevelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    imgUrl:{
        type:String,
        required: true
    },
    description: {
        type: String,
        required:true
    },
    startingPoint :{
        type:Number,
        required: true
    },
    endPoint:{
        type: Number, 
        required: true
    }, 
    role: { 
        type: String, 
        required: true
    }
})

var Level = mongoose.model('Level', LevelSchema);

module.exports = { Level };

