const mongoose = require("mongoose");

const shortSavedSchema = new mongoose.Schema(
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

const shortSavedTable = new mongoose.model("shortSaved", shortSavedSchema);

module.exports = {
    shortSavedTable
}