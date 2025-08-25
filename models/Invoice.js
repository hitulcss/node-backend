const mongoose = require('mongoose');

const invoiceSchema =  new mongoose.Schema({
    // user : {
    //     type :  mongoose.Schema.Types.ObjectId,
    //     ref: "UsersTable"
    // } ,
    // batch: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "BatchesTable"
    // }, 
    invoiceNumber : {
        type : Number ,
    }
} , { timestamps : true}) ;

const invoiceTable = new mongoose.model('invoiceTable' , invoiceSchema) ;

module.exports = {
    invoiceTable
}