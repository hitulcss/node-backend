const mongoose = require("mongoose")

const News_Clips = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    file_url: {
        type: Object
    },
    title: {
        type: String
    },
    is_active: {
        type: Boolean
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable'
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    created_at: {
        type: String
    },
    resource_type: {
        type: String,
        default: 'file'
    }
}, { timestamps: true })

const NewsClipsTable = new mongoose.model("NewsClipTable", News_Clips);

module.exports = {
    NewsClipsTable
}