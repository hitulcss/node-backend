const mongoose = require("mongoose")


const AssignmentsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BatchesTable'
    },
    file: {
        type: Object
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    link: {
        type: String
    },
    is_active: {
        type: Boolean
    },
    created_at: {
        type: String
    },

}, { timestamps: true })


const AssignmentTable = new mongoose.model("AssignmentTable", AssignmentsSchema)

module.exports = {
    AssignmentTable
}