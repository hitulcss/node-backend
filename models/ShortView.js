const mongoose = require("mongoose");

const shortViewSchema = new mongoose.Schema(
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

const shortViewTable = new mongoose.model("shortView", shortViewSchema);

module.exports = {
    shortViewTable
}