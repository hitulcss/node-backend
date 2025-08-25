const mongoose = require('mongoose')

const RecordedVideoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable"
  },
  title: {
    type: String
  },
  file_url: {
    type: Object
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchesTable"
  },
  language: {
    type: String,
    enum: ['hi', 'en', 'enhi']
  },
  lecture_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LectureTable"
  },
  is_active: {
    type: Boolean
  },
  created_at: {
    type: String
  },
  is_verfied: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true })


const RecordedVideoModel = new mongoose.model("RecordedUserTable", RecordedVideoSchema);

module.exports = {
  RecordedVideoModel
}


