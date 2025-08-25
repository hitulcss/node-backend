const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    upiId: {
        type: String,
        default: "",
    },
    amount: {
        type: String,
        default: "0"
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'accepted', 'rejected']
    },
    createdAt: {
        type: String,
        default: ""
    },
    updatedAt: {
        type: String,
        default: ""
    }
});

const withdrawalRequestTable = new mongoose.model("withdrawalRequestTable", withdrawalRequestSchema);

module.exports = {
    withdrawalRequestTable,
};
