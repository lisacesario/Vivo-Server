const {Achievement} = require('./models/gaming/achievement');
const {Level} = require('./models/gaming/level');
const { UserProfile } = require('./models/user_profile');
const { Tool } = require('./models/tools');
const { Step } = require('./models/steps');
const { Question } = require('./models/question');



const fakeDBData = require('./data.json');
const achievementDB = require('./demoData/achievements.json');
const itemsDB = require('./demoData/items.json');
const usersDB = require('./demoData/users.json');


class FakeDB {

    constructor(){
        this.users = usersDB.users
        this.questions = itemsDB.questions
        this.tools = itemsDB.tools       
        this.steps = itemsDB.steps
        this.achievements = achievementDB.achievements;
        this.levels = fakeDBData.levels;
    }

    async cleanDB(){
        await Level.deleteMany({});
        
        await Achievement.deleteMany({});
    }

    pushDataToDb() {
        console.log(" Achievements : ", this.achievements);
        console.log("   Levels : ", this.levels);

        this.achievements.forEach( (achievement) => {

            const newAchievement = new Achievement(achievement);
            newAchievement.save();

          });
          
          this.levels.forEach( (level)=>{
              const newLevel = new Level(level);
              newLevel.save()
          })


          this.tools.forEach((tool)=>{
              const newTool = new Tool(tool)
              newTool.save()
          })
          
          this.steps.forEach((step)=>{
              const newStep = new Step(step)
              newStep.save()
          })

          this.questions.forEach((question)=>{
              const newQuestion = new Question(question)
              newQuestion.save()
          })
        
    }
    
    async seedDB() {
        await this.cleanDB().catch(error =>{console.log(error); });
        this.pushDataToDb();
    }

}
    
module.exports = FakeDB;
