const mongoose = require("mongoose")

const TestCategorySchema = new mongoose.Schema(
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
        isActive: {
            type: Boolean,
            default: false
        },
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


const TestCategoryTable = new mongoose.model("TestCategoryTable", TestCategorySchema)
// TestCategoryTable.index({ isActive : 1} , { name : 'Active'})
module.exports = {
    TestCategoryTable
}

