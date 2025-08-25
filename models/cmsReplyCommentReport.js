const mongoose = require("mongoose");

const cmsReplyCommentReportSchema = new mongoose.Schema(
    {
        replyCommentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cmsCommentReplyTable"
        },
        user: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        }],
    },
    {
        timestamps: true,
    })

const cmsReplyCommentReportTable = new mongoose.model("cmsReplyCommentReportTable", cmsReplyCommentReportSchema);

module.exports = {
    cmsReplyCommentReportTable
}