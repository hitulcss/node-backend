const mongoose = require("mongoose")

const storeTxnSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'storeOrdesTable', required: true },
        txnAmount: { type: String, required: true },
        txnId: {
            type: String,
            default: ""
        },
        easePayId: {
            type: String,
            default: ""
        },
        reason: {
            type: String,
            default: ""
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        txnDate: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
    }
)


const storeTxnTable = new mongoose.model("storeTxnTable", storeTxnSchema)

module.exports = {
    storeTxnTable
}

