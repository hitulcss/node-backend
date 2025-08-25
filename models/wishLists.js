const mongoose = require('mongoose');

const wishListsSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref :"ProductsTable"
    },
    productCombo:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "ProductComboTable"
    },
    quantity :{
        type: Number,
        default :1 
    }
});

const wishListsTable = new mongoose.model("WishListsTable" , wishListsSchema);
module.exports = {
    wishListsTable
}