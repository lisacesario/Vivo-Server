const VivoLog = require('../models/analysis/log');


 module.exports = {

    createLog: function(action,category,createdBy,message) {

        const alog = new VivoLog({
            'action':action,
            'category':category,
            'createdBy':createdBy,
            'message':message,
            'createdAt':Date().now
        });

        VivoLog.create(alog, function(err, newLog){
            if(err){
                return console.log(err)
            }
            console.log("Log",newLog)
            newLog.save(function(err){
                if(err){
                    return err
                }
                return true
        })
    })
    }
 }