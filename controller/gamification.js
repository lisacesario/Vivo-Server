const Level = require('../models/gaming/level');
const { Achievement } = require('../models/gaming/achievement');

const UserProfile = require('../models/user_profile');

const CREATE_VALUE = 10
const UPDATE_VALUE = 10
const DELETE_VALUE = 10
const EVENT_VALUE = 10
const SOCIAL_VALUE = 10

module.exports = {
    computeAchievement: function (user, action, counter) {
        return new Promise((resolve, reject) => {
            Achievement.findOne({ 'action': action, 'required_point': counter })
                .exec()
                .then(achievement => {
                    console.log("A caso", achievement)
                    switch (action) {
                        case "Create":
                            user.exp = user.exp + CREATE_VALUE
                            user.game_counter.create_counter = counter;
                            break;
                        case "Update":
                            user.exp = user.exp + UPDATE_VALUE
                            user.game_counter.update_counter = counter
                            break;
                        case "Delete":
                            user.exp = user.exp + DELETE_VALUE
                            user.game_counter.delete_counter = counter
                            break;
                    }

                    if (!achievement) {
                        console.log("RIGETTA TUTTO")
                        user.save(function (err, isAuth) {
                            if (err) {
                                console.log(err)
                                return reject()
                            }
                            resolve(null)
                        });
                    }
                    else {

                        console.log("Entro qua dentro?", achievement)
                        var unlocked_achievement = user.achievements.filter(x => x.unlocked == false)
                            .filter(x => { return x.achievement == achievement.id })
                        
                        console.log("unlocked_achievement? ", unlocked_achievement)

                        user.achievements.filter(x => {
                            if (x.achievement == unlocked_achievement.id) {
                                x.unlocked = true;
                                x.unlocked_time = Date.now()
                                user.exp = user.exp + achievement.points
                                console.log("userexp? ", user.exp)

                            }
                        })
                        

                        user.save(function (err, isAuth) {
                            if (err) {
                                console.log(err)
                                reject()
                            }
                            resolve(achievement)
                        });
                       
                    }


                })
                .catch(err => {
                    console.log(err)
                    reject()
                })
        })
    }

}