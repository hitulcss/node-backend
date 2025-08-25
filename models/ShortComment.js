const mongoose = require("mongoose");

const shortCommentSchema = new mongoose.Schema(
    {
        short: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "short"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
        msg: {
            type: String,
            default: "",
        },
        
    },
    {
        timestamps: true,
    })

const shortCommentTable = new mongoose.model("shortComment", shortCommentSchema);

module.exports = {
    shortCommentTable
}