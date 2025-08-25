const mongoose = require("mongoose");

const appliedCoinsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    type: {
        type: String,
        default: "batch",
        enum: ['batch', 'testseries']
    },
    batchOrTestSeriesId: {
        type: String,
        default: ""
    },
    coins: {
        type: String,
        default: "0"
    },
    appliedAt: {
        type: String,
        default: ""
    },
}, { timestamps: true });

const AppliedCoinsTable = new mongoose.model("AppliedCoinsTable", appliedCoinsSchema);

module.exports = {
    AppliedCoinsTable,
};
