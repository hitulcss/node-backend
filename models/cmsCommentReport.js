const mongoose = require("mongoose");

const cmsCommentReportSchema = new mongoose.Schema(
    {
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cmsCommentTable"
        },
        user: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        }],
    },
    {
        timestamps: true,
    })

const cmsCommentReportTable = new mongoose.model("cmsCommentReportTable", cmsCommentReportSchema);

module.exports = {
    cmsCommentReportTable
}