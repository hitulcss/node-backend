const mongoose = require("mongoose")

const MyBatchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchesTable"
    },
    amount: {
        type: Number
    },
    is_active: {
        type: Boolean
    },
    is_paid: {
        type: Boolean
    },
    created_at: {
        type: String
    },
    isEmi  :{
        type : Boolean,
        default : false,
    },
    nextInstallmentDate : {
        type : Date,
        // required :true,
        // default : ""
    },
    pendingInstallment:{
        type: String,
        default : '0',
        enum : ["0" ,"1", "2","3","4","5","6"]
    },
    validForAccess : {
        type : Boolean,
        default :  true,
    },
    assignedDate: {
        type: Date,
        default: new Date()
    },
    updated_at: {
        type: String
    },
    invoice : {
        type : String ,
        default : ""
    },
    enrollAmount : {
        type : Number ,
        default : 0
    } ,
    totalAmountReceived : {
        type : Number ,
        default : 0 
    } , 
    validity : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ValidityTable' ,
        default : null ,
    } , 
    expireDate :  {
        type : Date ,
        default : Date.now()
    },
    remark:{
        type:String,
        default:""
    }
}, { timestamps: true })

const MybatchTable = new mongoose.model("MyBatchTable", MyBatchSchema);

// MybatchTable.createIndexes({ user: 1, batch_id: 1 }, { name: 'batchAndUser' })
// MyBatchSchema.index({ user: 1, batch_id: 1 }, { name: 'batchAndUser' })
MyBatchSchema.index({user :  1} , { name :  'userWise'})



module.exports = {
    MybatchTable
}