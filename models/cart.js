const mongoose = require('mongoose')

const CartSchema = new mongoose.Schema({
    created_at: {
        type: Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsersTable'
    },
    batch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BatchesTable'
    },
    Amount: {
        type: String
    },
    updated_at: {
        type: String
    },
    is_active: {
        type: Boolean
    },

}, { timestamps: true })

const CartTable = new mongoose.model("cartTable", CartSchema);

module.exports = {
    CartTable
}