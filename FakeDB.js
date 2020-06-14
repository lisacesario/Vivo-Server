const {Achievement} = require('./models/gaming/achievement');
const {Level} = require('./models/gaming/level');

const fakeDBData = require('./data.json');

class FakeDB {

    constructor(){
        this.achievements = fakeDBData.achievements;
        this.levels = fakeDBData.levels;
    }

    async cleanDB(){
        await Level.deleteMany({});
        
        await Achievement.deleteMany({});
    }

    pushDataToDb() {
        console.log(" Achievements : ", this.achievements);
        console.log("   Levels : ", this.levels);
       // const user = new User(this.users[0]);
       // const user2 = new User(this.users[1]);
    
        this.achievements.forEach( (achievement) => {

            const newAchievement = new Achievement(achievement);
            newAchievement.save();

          });
          
          this.levels.forEach( (level)=>{
              const newLevel = new Level(level);
              newLevel.save()
          })

        
    
        //user.save().catch(error=>{console.log(error); });
        // user2.save().catch(error=>{console.log(error); });
    }
    
    async seedDB() {
        await this.cleanDB().catch(error =>{console.log(error); });
        this.pushDataToDb();
    }

}
    
module.exports = FakeDB;
