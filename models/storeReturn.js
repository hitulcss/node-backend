const mongoose = require('mongoose');

const storeReturnSchema = new mongoose.Schema({
    user  :{
        type : mongoose.Schema.Types.ObjectId,
        ref  : 'UsersTable'
    },
    storeOrderId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'storeOrdesTable'
    },
    refundAmount : {
        type : String,
        default :""
    },
    bankName : {
        type : String ,
        default : "",
    },
    fullName : {
        type : String ,
        default : "",
    },
    accountNumber : {
        type : String ,
        default : "",
    },
    ifsc : {
        type : String ,
        default : "",
    },
    isRefund : {
        type : Boolean ,
        default : false
    }
}, { timestamps : true})

const storeReturnTable = new mongoose.model('storeReturnTable' , storeReturnSchema);

module.exports = {
    storeReturnTable
}