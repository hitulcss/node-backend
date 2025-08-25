const mongoose = require("mongoose");

const walletTxnSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    action: {
        type: String,
        default: "",
        enum: ['add', 'withdrawal']
    },
    reason: {
        type: String,
        default: "",
        enum: ['signup', 'referal', 'purchase']
    },
    amount: {
        type: String,
        default: "0"
    },
    dateTime: {
        type: String,
        default: ""
    },
});

const walletTxnTable = new mongoose.model("walletTxnTable", walletTxnSchema);

module.exports = {
    walletTxnTable,
};
