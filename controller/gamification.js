const Level = require('../models/gaming/level');
const {Achievement} = require('../models/gaming/achievement');

const UserProfile = require('../models/user_profile');

 module.exports = {

    computeAchievement : function(user,action, counter){

        return new Promise((resolve,reject)=>{
            Achievement.findOne({'action' : action, 'required_point':counter})
            .exec()
            .then(achievement =>{
                console.log("A caso", achievement)
                if(!achievement){
                    console.log("  RIGETTA TUTTO")
                    resolve(null)
                }
                else{
                    console.log("Entro qua dentro?", achievement)
                    var user_achievements = user.achievements.filter(x => x.unlocked == false)
                                                            .filter(x => {return x.achievement == achievement.id})
    
                    console.log("UserAchivement ", user_achievements)
                    resolve(achievement)
                }
                
              
            })
            .catch(err=>{
                console.log(err)
                reject()
            })
        })
       
    }
   
 }