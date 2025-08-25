const mongoose = require("mongoose")

const storeCartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        products: [{
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductsTable', required: true },
            quantity: { type: String, required: true },
        }],
        platform : {
            type : String ,
            default : 'store' ,
            enum  : ['app','store' , 'publication']
        },
    },
    {
        timestamps: true,
    },
    { versionKey: false }
)


const storeCartTable = new mongoose.model("storeCartTable", storeCartSchema)
storeCartSchema.index( { user  : 1} , { name : 'user'})
module.exports = {
    storeCartTable
}

