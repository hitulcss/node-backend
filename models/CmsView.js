const mongoose = require("mongoose");

const cmsViewSchema = new mongoose.Schema(
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

const cmsViewTable = new mongoose.model("cmsViewTable", cmsViewSchema);

module.exports = {
    cmsViewTable
}