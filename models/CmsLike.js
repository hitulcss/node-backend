const mongoose = require("mongoose");

const cmsLikeSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cmsPostTable"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
    },
    {
        timestamps: true,
    })

const cmsLikeTable = new mongoose.model("cmsLikeTable", cmsLikeSchema);

module.exports = {
    cmsLikeTable
}