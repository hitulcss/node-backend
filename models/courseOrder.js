const mongoose = require("mongoose")

const courseOrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        orderId: {
            type: String,
            default: ""
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BatchesTable',
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
        isEmi : {
            type : Boolean,
            default :  false
        },
        noOfInstallments: {
            type : String,
            default : '1',
            enum : ["1" , "2" , "3" , "6"]
        },
        pendingInstallment:{
            type: String,
            default : '0',
            enum : ["0" ,"1", "2","3","4","5","6"]
        },
        pendingAmount : {
            type : String ,
            default : ""
        },
        eachInstallmentAmount : {
            type : String ,
            default : ""
        },
        nextInstallmentDate : {
            type : Date,
            // required :true,
            // default : ""
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
        platform : {
            type : String ,
            default : 'website' ,
            enum  : ['app','ios' , 'website']
        },
    },
    {
        timestamps: true,
    }
)


const courseOrdesTable = new mongoose.model("courseOrdesTable", courseOrderSchema)
courseOrderSchema.index({ user :  1} , { name : 'userWise'})
module.exports = {
    courseOrdesTable
}

