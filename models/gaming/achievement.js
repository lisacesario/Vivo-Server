const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AchievementSchema = new Schema({

})

var Achievement = mongoose.model('Achievement', AchievementSchema);

module.exports = { Achievement };

