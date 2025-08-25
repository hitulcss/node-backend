const mongoose = require("mongoose")

const productCategorySchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'adminTeacherTable'
        },
        title: {
            type: String,
            default: ""
        },
        slug: {
            type: String,
            default: ""
        },
        icon: {
            type: String,
            default: ""
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productCategoryTable",
            default: null
        },
        isActive: {
            type: Boolean,
            default: false
        },
        order : {
            type:String,
            default : ""
        } ,
        metaTitle : {
            type : String ,
            default : ""
        } ,
        metaDesc : {
            type : String ,
            default : ""
        } ,
        shareLink : {
            type : Object ,
            default : {
                link : "" ,
                text : ""
            }
        },
    },
    {
        timestamps: true,
    }
)


const productCategoryTable = new mongoose.model("productCategoryTable", productCategorySchema)
productCategorySchema.index({ isActive : 1} , { name : 'Active'})
module.exports = {
    productCategoryTable
}

