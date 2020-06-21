const {Level} = require('../models/gaming/level');
const { Achievement } = require('../models/gaming/achievement');

const UserProfile = require('../models/user_profile');

const CREATE_VALUE = 10
const UPDATE_VALUE = 10
const DELETE_VALUE = 10
const EVENT_VALUE = 10
const SOCIAL_VALUE = 10



module.exports = {

    computeLevel : function(user){
        return new Promise((resolve, reject)=>{
            console.log("CALCOLO LIVELLO")
            Level.findById(user.level.level).exec()
                .then(current_level =>{
                    if(current_level.endPoint > user.exp){
                        resolve(null)
                    }
                    else{
                        console.log("Nuovo livello")

                        Level.findOne({'position': (current_level.position + 1)}).exec()
                            .then( newLevel =>{
                                console.log("nuovo livello", newLevel)
                                user.level.level = newLevel;
                                user.level.unlocked_time = Date.now()
                                user.save(function(err,user){
                                    if(err){
                                        console.log(err)
                                        reject()
                                    }
                                    else{
                                        resolve(newLevel)
                                    }
                                })
                            })
                            .catch(err =>{
                                console.log(err)
                                reject()
                            })
                    }
                })
                .catch(err =>{
                    console.log(err);
                    reject()
                })
        }
    )},
    computeAchievement: function (user, action, counter) {
        return new Promise((resolve, reject) => {
            console.log("calcola achievement")
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
                        console.log("check Livello")

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


                        user.achievements.forEach(x => {
                            if (x.achievement == unlocked_achievement[0].achievement) {
                                console.log("ci entor qui?")
                                x.unlocked = true;
                                x.unlocked_time = Date.now()
                            }
                        });
                       /* user.achievements.filter(x => {
                            console.log("partenza:", unlocked_achievement[0].achievement)
                            console.log("destinazione:", x.achievement)
                            if (x.achievement == unlocked_achievement[0].achievement) {
                                console.log("ci entor qui?")
                                x.unlocked = true;
                                x.unlocked_time = Date.now()
                            }
                        })*/

                        user.exp = user.exp + achievement.points
                        console.log("ecp ", user.exp )

                        user.save(function (err, isAuth) {
                            if (err) {
                                console.log("perovlema,", err)
                                reject(err)
                            }
                            console.log("achievement ")
                            resolve(achievement)
                        });
                       
                    }


                })
                .catch(err => {
                    console.log("errore",err)
                    reject()
                })
        })
    }

}