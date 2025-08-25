const mongoose = require("mongoose")
const { isAdmin } = require("../middleware/authenticateToken")

const storeBannerSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'adminTeacherTable'
        },
        title: {
            type: String,
            default: ""
        },
        icon: {
            type: String,
            default: ""
        },
        bannerType: {
            type: String,
            enum: ['APP', 'WEB', 'TAB']
        },
        link: {
            type: String,
            default: 'none',
            enum: ['none', 'product', 'category', 'link']
        },
        linkWith: {
            type: String,
            default: 'NA'//productId/bookId
        },
        isActive: {
            type: Boolean,
            default: false
        },
        order : {
            type:String,
            default : ""
        }
    },
    {
        timestamps: true,
    }
)


const storeBannerTable = new mongoose.model("storeBannerTable", storeBannerSchema)
storeBannerSchema.index({ bannerType : 1 , isActive : 1} , { name : 'typeAndActive'})
module.exports = {
    storeBannerTable
}

