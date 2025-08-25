const mongoose = require('mongoose');


const NotificationSchema = new mongoose.Schema({
    user: {
        type: String,
    },
    to: {
        type: String,
    },
    title: {
        type: String
    },
    notificationBody: {
        type: String
    },
    Avatar: {
        type: String
    },
    type: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    isUnRead: {
        type: Boolean
    }

}, { timestamps: true })


const NotificationModel = new mongoose.model("NotificatioTable", NotificationSchema);


module.exports = {
    NotificationModel
}