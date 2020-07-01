const { Level } = require('../models/gaming/level');
const { Achievement } = require('../models/gaming/achievement');

const {UserProfile} = require('../models/user_profile');

const CREATE_VALUE = 10
const UPDATE_VALUE = 10
const DELETE_VALUE = 10
const EVENT_VALUE = 10
const SOCIAL_VALUE = 10



module.exports = {


    computeLevelCreate: function (user) {
        return new Promise((resolve, reject) => {
            console.log("CALCOLO LIVELLO")
            Level.findById(user.level.level).exec()
                .then(current_level => {
                    console.log(current_level)
                    if (current_level.endPoint > user.exp) {
                        resolve(null)

                    }
                    else {
            
                        Level.findOne({ 'position': (current_level.position + 1) }).exec()
                            .then(newLevel => {
                                console.log("nuovo livello", newLevel)
                               // user.level.level = newLevel;
                                ///user.level.unlocked_time = Date.now()
                                resolve(newLevel)
                            })
                            .catch(err => {
                                console.log(err)
                                reject()
                            })
                        }
                    
                })
                .catch(err => {
                    console.log(err);
                    reject()
                })
        }
        )
    },
    computeAchievementForCreate: function (user) {
        return new Promise((resolve, reject) => {
            Achievement.findOne({ 'action': "Create", 'required_point': user.game_counter.create_counter  })
                .exec()
                .then(achievement => {
                    if (!achievement) {
                        console.log("RIGETTA TUTTO")
                        resolve(null)
                    }
                    else {
                        resolve(achievement)
                    }
                })
                .catch(err => {
                    console.log("errore", err)
                    reject()
                })
        })
    },
    computeAchievement: function (user,counter,action) {
        return new Promise((resolve, reject) => {
            Achievement.findOne({ 'action': action, 'required_point': counter })
                .exec()
                .then(achievement => {
                    if (!achievement) {
                        console.log("RIGETTA TUTTO")
                        resolve(null)
                    }
                    else {
                        resolve(achievement)
                    }
                })
                .catch(err => {
                    console.log("errore", err)
                    reject()
                })
        })
    },

}
