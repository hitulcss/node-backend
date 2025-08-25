const mongoose = require("mongoose");

const shortLikeSchema = new mongoose.Schema(
    {
        short: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "short"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
    },
    {
        timestamps: true,
    })

const shortLikeTable = new mongoose.model("shortLike", shortLikeSchema);

module.exports = {
    shortLikeTable
}