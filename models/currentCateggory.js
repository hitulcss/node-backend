const mongoose = require("mongoose");

const currentCategoryTableSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categoryTable",
    },
    subCategory :   {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subCategoryTable',
        default: null
      },
}, { timestamps: true });

const currentCategory = new mongoose.model("currentCategory", currentCategoryTableSchema);

module.exports = {
    currentCategory,
};
