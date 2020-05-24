const { Log } = require('../models/analysis/log')


exports.createLog = function(action,category, createdBy,message,createdAt) {

        const log = new Log({
            'action':action,
            'category':category,
            'createdBy':createdBy,
            'message':message,
            'createdAt':createdAt
        });

        Log.create(log, function(err, newLog){
            if(err){
                return console.err(err)
            }
            newLog.save()
            return
        } )
    }
