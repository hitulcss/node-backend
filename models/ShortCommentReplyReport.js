const mongoose = require("mongoose");

const shortCommentReplyReportSchema = new mongoose.Schema(
    {
        replyComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "shortCommentReply"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
        reason: {
            type: String,
            default: "",
        },
        
    },
    {
        timestamps: true,
    })

const shortCommentReplyReportTable = new mongoose.model("shortCommentReplyReport", shortCommentReplyReportSchema);

module.exports = {
    shortCommentReplyReportTable
}