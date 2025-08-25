const mongoose = require("mongoose");

const youtubeCommentSchema = new mongoose.Schema(
    {
        user : {
                type: mongoose.Schema.Types.ObjectId,
                ref: "UsersTable",
        },
        replyTo : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
            default : null , 
        },
        youtubeId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "YouTube_Url"
        },
        commentId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "YoutubeCommentTable" , 
            default : null 
        },
        msg: {
            type: String,
            default: "",
        },
        
    },
    {
        timestamps: true,
    })

const YoutubeCommentTable = new mongoose.model("YoutubeCommentTable", youtubeCommentSchema);

module.exports = {
    YoutubeCommentTable
}