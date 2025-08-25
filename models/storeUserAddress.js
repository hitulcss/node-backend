const mongoose = require("mongoose")

const storeUserAddressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        name: {
            type: String,
            default: ""
        },
        email: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        streetAddress: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        pinCode: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
        isActive : {
            type : Boolean ,
            default : true 
        }
    },
    {
        timestamps: true,
    }
)


const storeUserAddressTable = new mongoose.model("storeUserAddressTable", storeUserAddressSchema)

module.exports = {
    storeUserAddressTable
}

