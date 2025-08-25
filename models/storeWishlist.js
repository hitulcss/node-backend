const mongoose = require("mongoose")

const storeWishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        products: [{
            type: mongoose.Schema.Types.ObjectId, ref: "ProductsTable"
        }],
        platform : {
            type : String ,
            default : 'store' ,
            enum  : ['app','store' , 'publication']
        },
    },
    {
        timestamps: true,
    }
)


const storeWishlistTable = new mongoose.model("storeWishlistTable", storeWishlistSchema)
storeWishlistSchema.index({ user : 1} , { name : 'user'})
module.exports = {
    storeWishlistTable
}

