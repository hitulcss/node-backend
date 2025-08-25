const mongoose = require("mongoose");

const cmsCommentReplySchema = new mongoose.Schema(
    {
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cmsCommentTable"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
        msg: {
            type: String,
            default: "",
        },
        replyTo:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        }
    },
    {
        timestamps: true,
    })

const cmsCommentReplyTable = new mongoose.model("cmsCommentReplyTable", cmsCommentReplySchema);

module.exports = {
    cmsCommentReplyTable
}