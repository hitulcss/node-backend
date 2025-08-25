const mongoose = require("mongoose")

const LiveStreamSchema = new mongoose.Schema({
    channelName: {
        type: String
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    description: {
        type: String
    }
}, { timestamps: true })

const LiveStreamTable = new mongoose.model("LiveStreamTable", LiveStreamSchema);

module.exports = {
    LiveStreamTable
}