const mongoose = require("mongoose")

const SchedularSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    },
    task: {
        type: String
    },
    notify_at: {
        type: String
    },
    is_active: {
        type: Boolean
    }
}, { timestamps: true })


const SchedularTable = new mongoose.model("SchedularTable", SchedularSchema);

module.exports = {
    SchedularTable
}