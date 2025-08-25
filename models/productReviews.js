const mongoose = require("mongoose");

const productReviewsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UsersTable",
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductsTable",
        },
        title: {
            type: String,
            default: ""
        },
        rating: {
            type: String,
            default: "5",
        },
        description: {
            type: String,
            default: ""
        },
    },
    {
        timestamps: true,
    });

const productReviewsTable = new mongoose.model("productReviewsTable", productReviewsSchema);
productReviewsSchema.index({ product : 1 } , { name  : 'product'})
module.exports = {
    productReviewsTable
}