const mongoose = require("mongoose")

const StreamChatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable'
        },
        lectureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LectureTable'
        },
        message: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true
        },

    },
    {
        timestamps: true,
    }
)

const StreamChatTable = new mongoose.model("streamChat", StreamChatSchema);

module.exports = {
    StreamChatTable
}
