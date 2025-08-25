const mongoose = require("mongoose")

const storeOrdesSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        orderId: {
            type: String,
            default: ""
        },
        products: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProductsTable',
                required: true
            },
            quantity: { type: String, required: true },
        }],
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
        deliveryStatus:{
            type : String , 
            default : "processing",
            enum:["processing","placed","shipped" , "inTransit" , 'outForDelivery' ,'delivered' ,'pending','cancelled', 'userCancelled' , 'customerReturn' , 'courierReturn' , 'packed']
        },
        txnId: {
            type: String,
            default: ""
        },
        addressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "storeUserAddressTable",
            required: true
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        purchaseDate: {
            type: String,
            default: ""
        },
        shippingCompany : {
            type : String ,
            default : '',
        },
        awbNumber: {
            type : String ,
            default : ''
        },
        trackingId : {
            type : String , 
            default:""
        },
        trackingLink : {
            type : String ,
            default :"",
        },
        returnDate : {
            type : Date ,
        } ,
        dispatchDate : {
            type : Date ,
        }, 
        deliveredDate : {
            type :  Date
        },
        orderType : {
            type :  String , 
            default : 'prePaid' ,
            enum : ['COD' , 'prePaid']
        } , 
        deliveryCharges : {
            type : String ,
            default : '0' ,
        } ,
        cancelDate : {
            type : Date ,
        } , 
        invoice : {
            type : String , 
            default : '' ,
        } ,
        invoiceDate : {
            type : Date ,
        } , 
        platform : {
            type : String ,
            default : 'store' ,
            enum  : ['app','store' , 'publication']
        },
        shippingAddress : {
            type : Object ,
            default : {
                id: "",
                name:  "",
                email:  "",
                phone:  "",
                streetAddress: "",
                city:  "",
                state:  "",
                country:  "",
                pinCode:  "",
              } ,
        }
    },
    {
        timestamps: true,
    }
)


const storeOrdesTable = new mongoose.model("storeOrdesTable", storeOrdesSchema)
storeOrdesSchema.index({ user : 1} , { name : 'user'})
module.exports = {
    storeOrdesTable
}

