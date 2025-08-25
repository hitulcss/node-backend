const mongoose = require("mongoose");

const batchCommunityCommentReplySchema = new mongoose.Schema(
    {
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BatchCommunityComment"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
        msg: {
            type: String,
            default: "",
        },
        // replyTo:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'UsersTable',
        // }
    },
    {
        timestamps: true,
    })

const BatchCommunityCommentReply = new mongoose.model("BatchCommunityCommentReply", batchCommunityCommentReplySchema);

module.exports = {
    BatchCommunityCommentReply
}