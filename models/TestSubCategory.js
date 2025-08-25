const mongoose = require("mongoose")

const TestSubCategorySchema = new mongoose.Schema(
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
        isActive: {
            type: Boolean,
            default: true
        },
       
    },
    {
        timestamps: true,
    }
)


const TestSubCategoryTable = new mongoose.model("TestSubCategoryTable", TestSubCategorySchema)
// TestCategoryTable.index({ isActive : 1} , { name : 'Active'})
module.exports = {
    TestSubCategoryTable
}

