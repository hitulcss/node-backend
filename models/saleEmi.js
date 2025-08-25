const mongoose = require("mongoose")

const saleEmiSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchesTable"
    },
    myBatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MyBatchTable"
    },
    amount: {
        type: Number
    },
    isPaid: {
        type: Boolean,
        default : false ,
    },
    installmentDate : {
        type : Date,
    },
    txnDate : {
        type : Date,
    },

    txnMode:{
        type: String,
        default : 'QR',
        enum : ["QR" ,"Link", "AccountTransfer","JODO","ShopeSe"]
    },
    txnId : {
        type : String ,
        default : ""
    },
    
    
}, { timestamps: true })

const saleEmiTable = new mongoose.model("saleEmiTable", saleEmiSchema);

// MybatchTable.createIndexes({ user: 1, batch_id: 1 }, { name: 'batchAndUser' })
// MyBatchSchema.index({ user: 1, batch_id: 1 }, { name: 'batchAndUser' })
saleEmiSchema.index({user :  1} , { name :  'userWise'})
module.exports = {
    saleEmiTable
}