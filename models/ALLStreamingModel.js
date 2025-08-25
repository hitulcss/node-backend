const mongoose = require('mongoose')


const AllStreamingSchema = new mongoose.Schema({
    ChannelName: {
        type: String
    },
    usersCount: {
        type: Number
    },
    Message: {
        type: String
    },
    is_Active: {
        type: Boolean
    },
    Stream_title: {
        type: String
    },
    blockedUsers: [{
        type: String
    }],
    Start_dateTime: {
        type: String
    },
    end_time: {
        type: String
    },
    feature_image: {
        type: String
    },
    Description: {
        type: String
    },
    created_at: {
        type: String
    },
}, { timestamps: true })

const AllStreamingTable = new mongoose.model('AllStreamingTable', AllStreamingSchema)

module.exports = {
    AllStreamingTable
}