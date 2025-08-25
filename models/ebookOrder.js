const mongoose = require("mongoose")

const ebookOrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        orderId: {
            type: String,
            default: ""
        },
        ebookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ebookTable',
            required: true
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'couponTable'
        },
        totalAmount: { type: String, required: true },
        paymentStatus: {
            type: String,
            default: 'pending',
            enum: ['success', 'failed', 'pending']
        },
        txnId: {
            type: String,
            default: ""
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        purchaseDate: {
            type: String,
            default: ""
        },
        utm_campaign:{
            type:String,
            default:""
        },
        utm_source:{
            type:String,
            default:""
        },
        utm_medium:{
            type:String,
            default :""
        },
        invoice :[ {
            type : Object ,
        }]
    },
    {
        timestamps: true,
    }
)


const ebookOrderTable = new mongoose.model("ebookOrderTable", ebookOrderSchema)
ebookOrderSchema.index({ user :  1} , { name : 'userWise'})
module.exports = {
    ebookOrderTable
}

