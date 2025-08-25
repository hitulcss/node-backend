const mongoose = require("mongoose")


const paymentTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"                                 //backend
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'couponTable'
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
        type: String,                               //backend
        default: ""
    },
    userOrederId: {
        type: String,
        default: ""
    },
    batch_name: {
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
    },
    invoice :[ {
        type : Object ,
        // default : {
        //     installmentNumber : "" ,
        //     fileUrl : "" 
        // }
    }] , 
    validity : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ValidityTable' ,
        default : null ,
    },
    remark:{
        type:String,
        default:""
    }

}, { timestamps: true })


const paymentTransactionTable = new mongoose.model("paymentTransactionTable", paymentTransactionSchema)
paymentTransactionSchema.index({ user : 1} ,{ name : "user"})
module.exports = {
    paymentTransactionTable
}