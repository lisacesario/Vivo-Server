const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const LevelSchema = new Schema({

})

var Level = mongoose.model('Level', LevelSchema);

module.exports = { Level };

