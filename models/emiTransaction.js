const mongoose = require('mongoose');

const emiTxnSchema = new mongoose.Schema({
      user : {
        type : mongoose.Schema.Types.ObjectId,
        ref :  'UsersTable'
      },
      courseOrderId : {
         type : mongoose.Schema.Types.ObjectId,
         ref : 'courseOrdesTable'
      },
     transactionId  :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'courseTxnTable'
     },
     installmentNumber : {
      type : String ,
      default: "1"
     },
     paidDate: {
      type : String ,
      default : ""
     },
     dueDate : {
      type : String ,
      default : ""
     },
     isPaid : {
      type :  Boolean,
      default : false
     },
     amount : {
        type : String ,
        default : ""
     },
     previousOutstanding : {
        type : String ,
        default : ""
     },
     penality : {
        type : String ,
        default : ''
     }
} , { timestamps : true})

const emiTxnTable = new mongoose.model("emiTxnTable" , emiTxnSchema);

module.exports = {
  emiTxnTable
}