const mongoose = require("mongoose");

const shortCommentReportSchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "shortComment"
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

const shortCommentReportTable = new mongoose.model("shortCommentReport", shortCommentReportSchema);

module.exports = {
    shortCommentReportTable
}