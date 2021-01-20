const { Achievement } = require("../models/gaming/achievement")

exports.getAchievements = function (req, res, next) {

    Achievement.find()
        .sort({'required_point':'ascending'})
        .exec()
        .then(achievements  => {
            return res.status(200).send(achievements)
        })
        .catch(err => {
            return res.status(422).send(
                {
                    "action": "Get Achievements ",
                    "success": false,
                    "status": 422,
                    "error": {
                        "code": err,
                        "message": "Error in retrieving achievements"
                    }
                }
            )
        })
}