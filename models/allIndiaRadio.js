const mongoose = require('mongoose')

const All_India_Radio = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    data: {
        type: String
    },
    audio_file: {
        type: Object
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    is_active: {
        type: Boolean
    },
    created_at: {
        type: String
    }
}, { timestamps: true })

const AIRTable = new mongoose.model("AllINdiaRadio", All_India_Radio)

module.exports = {
    AIRTable
}