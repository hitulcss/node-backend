const mongoose = require("mongoose")

const courseTxnSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'courseOrdesTable',
            required: true
        },
        txnAmount: {
            type: String,
            required: true
        },
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


const courseTxnTable = new mongoose.model("courseTxnTable", courseTxnSchema)

module.exports = {
    courseTxnTable
}

