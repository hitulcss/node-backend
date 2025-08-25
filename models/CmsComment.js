const mongoose = require("mongoose");

const cmsCommentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cmsPostTable"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
        msg: {
            type: String,
            default: "",
        },
        isPin : {
            type : Boolean ,
            default : false
        }
    },
    {
        timestamps: true,
    })

const cmsCommentTable = new mongoose.model("cmsCommentTable", cmsCommentSchema);

module.exports = {
    cmsCommentTable
}