const mongoose = require("mongoose");

const BatchCommunityViewSchema = new mongoose.Schema(
    {
        batchCommunity: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BatchCommunity"
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable',
        }],
    },
    {
        timestamps: true,
    })

const BatchCommunityView = new mongoose.model("BatchCommunityView", BatchCommunityViewSchema);

module.exports = {
    BatchCommunityView
}