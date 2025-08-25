const mongoose = require("mongoose")

const fcmPushNoficationSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    banner: {
        type: String,
        default: ""
    },
    link: {
        type: String,
        default: "none",
        enum: ['none', 'course', 'testSeries', '']
    },
    linkWith: {
        type: String,
        default: ""
    },
    schdeduleAt: {
        type: Date,
        default: new Date()
    },
    createdAt: {
        type: Date,
        default: new Date()

    },

}, { timestamps: true })

const PushNotificationTable = new mongoose.model("PushNotificationTable", fcmPushNoficationSchema)

module.exports = {
    PushNotificationTable
}