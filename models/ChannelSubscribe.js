const mongoose = require("mongoose");

const channelSubscribeSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "channel"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        },
    },
    {
        timestamps: true,
    })

const channelSubscribeTable = new mongoose.model("channelSubscribe", channelSubscribeSchema);

module.exports = {
    channelSubscribeTable
}