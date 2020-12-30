const moment = require('moment');


function formatMessage(username,text){
    return{
        username,
        text,
        time: moment().format('h:mm a')
    }
}


const users = []
function userJoin(id,username, room){
    const user = {id, username, room};
    user.push(user)
    return user
}

function getCurrentUser(id){
    return users.find(user => user.id === id)
}

module.exports = formatMessage()