const mongoose = require('mongoose')

const LectureResourceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchesTable"
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LectureTable"
    },
    title: {
        type: String,
        default: ""
    },
    created_at: {
        type: String,
        default: ""
    },
    is_active: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    resourceType: {
        type: String,
        enum: ["pdf", "link", 'video', 'yt_videos', "DPP"]
    },
    upload_file: {
        type: Object
    },
    is_Verified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })


const LectureResourceTable = new mongoose.model("LectureResourceTable", LectureResourceSchema);
LectureResourceSchema.index({ is_active : 1, resourceType : 1 , lecture : 1} , { name : 'lectureActive'})
module.exports = {
    LectureResourceTable
}