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
                        console.log("check Livello")

                       /** CAMBIARE I DUE MODELLI
                        *  Un utente ha un solo livello alla volta
                        *  controllo se l'esperienza accumulata supera endPoint del livello
                        *   se non supera, non succede niente
                        *  se supera cerco il livello successivo. Prevedere un campo numerico progressivo
                        *  es. numero livello 1 -> Level.find({numero_livello = acstual_lvel+1})
                        *  pop il vecchio e push il nuovo nel campo utente
                        */
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

                        console.log("Ci sono problemi?")
                        user.exp = user.exp + achievement.points

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