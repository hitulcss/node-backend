const mongoose = require("mongoose")


const TestSeriesPaymentTransaction = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"                                 //backend
    },
    name: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    mobileNumber: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    amount: {
        type: String,
        default: "0"
    },
    orderId: {
        type: String,                                //backend

    },
    userOrederId: {
        type: String,
        default: ""
    },
    TestSeries_name: {
        type: String,
        default: ""
    },
    transactionDate: {
        type: String,
        default: ""
    },
    payment_id: {
        type: String,
        default: ""
    },
    created_at: {
        type: Date,
        default: new Date()
    },
    success: {
        type: Boolean,
        default: false
    }
})


const paymentTransactionTestSeries = new mongoose.model("TestSeriesPaymentTransaction", TestSeriesPaymentTransaction)

module.exports = {
    paymentTransactionTestSeries
}