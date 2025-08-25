const mongoose = require('mongoose')
const { formatDate } = require('../middleware/dateConverter')

const MyTestSeriesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    testseries_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSeriesTable"
    },
    amount: {
        type: Number
    },
    is_active: {
        type: Boolean
    },
    is_paid: {
        type: Boolean
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String,
        default: formatDate(new Date())
    },
    assignedDate: {
        type: Date,
        default: new Date()
    },
}, { timestamps: true })

const MyTestSeriesTable = new mongoose.model("MyTestSeriesTable", MyTestSeriesSchema)

module.exports = {
    MyTestSeriesTable
}
