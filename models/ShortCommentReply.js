const mongoose = require("mongoose");

const shortCommentReplySchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "shortComment"
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

const shortCommentReplyTable = new mongoose.model("shortCommentReply", shortCommentReplySchema);

module.exports = {
    shortCommentReplyTable
}