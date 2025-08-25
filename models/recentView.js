const mongoose = require('mongoose');

const recentViewedSchema =  new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId ,
        ref: "UsersTable",
        // required : true 
        // default : true ,
    } , 
    products : [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ProductsTable', 
        required: true
    }]
} , { timestamps : true})

const recentViewedTable = new mongoose.model('recentViewedTable' , recentViewedSchema) 

module.exports = {
    recentViewedTable
}