
const mongoose = require('mongoose');
const faqsSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    question: {
        type: String,
        default: ''
    },
    answer: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'batch',
        enum: ['batch', 'category', 'home']
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })
const faqsTable = new mongoose.model('faqsTable', faqsSchema);
module.exports = {
    faqsTable
}