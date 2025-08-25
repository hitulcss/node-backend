const mongoose = require('mongoose')

const ContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable'
    },
    title: {
        type: String
    },
    data: {
        type: String
    },
    is_active: {
        type: Boolean
    },
    created_at: {
        type: String
    },

}, { timestamps: true })

const Contact_Info = new mongoose.model("Contact_Info", ContactSchema)
module.exports = {
    Contact_Info
}