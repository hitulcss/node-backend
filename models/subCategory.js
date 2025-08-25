const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable',

    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable',
    },
    title: {
        type: String,
        default: "",
    },
    slug : {
        type: String,
        default: "",
    },
    is_active: {
        type: Boolean,
        default: false,

    },
    created_at: {
        type: String,
        default: "",
    },
})

const subCategoryTable = new mongoose.model("subCategoryTable", subCategorySchema)

module.exports = {
    subCategoryTable
}