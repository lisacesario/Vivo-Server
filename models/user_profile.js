const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var options = { discriminatorKey: 'role' }

const UserProfileSchema = new Schema({
    uid: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: 'email is required',
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
        max: [30, 'Too Long, max 30 characters'],
        min: [10, 'Too short, min 5']
    },
    displayName: {
        type: String,
        required: false,
        default: ""
    },
    photoURL: {
        type: String,
        required: false,
    },
    dateOfCreation: {
        type: Date,
        default: Date.now,
    },
    role: {
        type: String,
        required: true
    },
    followers:[{
        _id: false,
        read: { type: Boolean, default: false },
        request_accepted: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
        follower: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile'
        },
    }],
    followed:[{
        _id: false,
        read: { type: Boolean, default: false },
        request_accepted: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
        followed: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile'
        },
    }],
    permission:{
        can_write: { type: Boolean, default: false },
        can_see_bio_info: { type: Boolean, default: false },
        can_see_follower_list: { type: Boolean, default: false },
        can_see_followed_list: { type: Boolean, default: false },
        can_see_agenda : { type: Boolean, default: false },
        can_see_stats: { type: Boolean, default: false },
        can_see_achievements: { type: Boolean, default: false },
    },
    followers_old: [{
        _id: false,
        read: { type: Boolean, default: false },
        request_accepted: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
        follower_id: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile'
        },
        permission: {
            can_write: { type: Boolean, default: false },
            can_see_bio_info: { type: Boolean, default: false },
            can_see_follower_list: { type: Boolean, default: false },
            can_see_followed_list: { type: Boolean, default: false },
            can_see_agenda : { type: Boolean, default: false },
            can_see_stats: { type: Boolean, default: false },
            can_see_achievements: { type: Boolean, default: false },

        }
    }],
    followed_old: [{
        _id: false,
        request_accepted: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
        followed_id: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile'
        },
        permission: {
            can_write: { type: Boolean, default: false },
            can_see_bio_info: { type: Boolean, default: false },
            can_see_follower_list: { type: Boolean, default: false },
            can_see_followed_list: { type: Boolean, default: false },
            can_see_agenda : { type: Boolean, default: false },
            can_see_stats: { type: Boolean, default: false },
            can_see_achievements: { type: Boolean, default: false },

        }
    }],
    activities_i_like: [{
        type: Schema.Types.ObjectId,
        ref: 'BaseActivity',
        required: false
    }],
    level: {
        _id: false,
        unlocked_time: { type: Date, required: false },
        level: {
            type: Schema.Types.ObjectId,
            ref: 'Level'
        }
    },
    achievements: [{
        _id: false,
        unlocked: { type: Boolean, default: false },
        unlocked_time: { type: Date, required: false },
        achievement: {
            type: Schema.Types.ObjectId,
            ref: 'Achievement'
        }
    }],
    exp: {
        type: Number,
        required: false,
        default: 0
    },
    first_access: {
        type:Boolean,
        default:false
    },
    game_counter: {
        create_counter : {type:Number, default:0},
        update_counter : {type:Number, default:0},
        delete_counter : {type:Number, default:0},
        add_counter    : {type:Number, default:0},
        social_counter : {type:Number, default:0},
        event_counter  : {type:Number, default:0},
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Messages',
        required: false
    }],
    post: [{
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: false
    }],
    events: [{
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: false
    }],
    favourite_activities: [{
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: false
    }],
}, options);


const TeacherProfileSchema = new Schema({
    groups: [{
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: false
    }],
    learners: [{
        _id : false,
        read : {type: Boolean, default:false},
        request_accepted : {type: Boolean, default:false},
        learner : {
            type: Schema.Types.ObjectId,
            ref: 'Learner',
            required: false
        }
    }]
}, options)


const LearnerProfileSchema = new Schema({
    characters: [{
        _id: false,
        character: {
            type: Schema.Types.ObjectId,
            ref: 'Character',
            required: false
        },
        unlocked_time: { type: Date, default: Date.now() }
    }],
    activities_completed: [{
        _id: false,
        date: { type: Date, default: Date.now() },
        activity: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: false
        },
        score :{type:Number, default:0}
    }],
    teachers: [{
        _id : false,
        read : {type: Boolean, default:false},
        request_accepted : {type: Boolean, default:false},
        teacher : {
            type: Schema.Types.ObjectId,
            ref: 'Teacher',
            required: false
        },
        //can_edit_agenda: { type: Boolean, default: false },
    }],
    agenda: [{
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: false
    }]

}, options);



var UserProfile = mongoose.model('UserProfile', UserProfileSchema);
var TeacherProfile = UserProfile.discriminator('Teacher', TeacherProfileSchema);
var LearnerProfile = UserProfile.discriminator('Learner', LearnerProfileSchema);

module.exports = { UserProfile, TeacherProfile, LearnerProfile};


