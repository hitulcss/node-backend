const mongoose = require("mongoose");
const LectureSchema = new mongoose.Schema({
  user_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatchesTable",
  },
  lecture_type: {
    type: String,
    enum: ["YT", "APP", "TWOWAY"],
  },
  lecture_title: {
    type: String,
  },
  description: {
    type: String,
  },
  teacher: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adminTeacherTable",
    },
  ],
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubjectTable",
  },
  link: {
    type: String,
    default: "",
  },
  LiveOrRecorded: {
    type: String,
  },
  starting_date: {
    type: String,
  },
  ending_date: {
    type: String,
  },
  startingDate: {
    type: Date,
  },
  endingDate: {
    type: Date,
  },
  material: {
    type: Object,
    default: {
      fileLoc: "",
      fileName: "",
      fileSize: "",
    },
  },
  dpp: {
    type: Object,
    default: {
      fileLoc: "",
      fileName: "",
      fileSize: "",
    },
  },
  // student:[{
  //     type:mongoose.Schema.Types.ObjectId,
  //     ref:"UsersTable"
  // }],
  ytLiveChatId: {
    type: String,
    default: "",
  },
  created_at: {
    type: String,
  },
  language: {
    type: String,
    enum: ["hi", "en", "enhi"],
  },
  updated_at: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  commonName: {
    type: String,
    default: ""
  },
  socketUrl: {
    type: String,
    default: "https://twoway-backend-prod.sdcampus.com/mediasoup",
  },
  banner: {
    type: String,
    default: "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg"
  },
  isCommentAllowed: {
    type: Boolean,
    default: true
  }

  // type:{
  //     type:String
  // }
  // is_live:{
  //     type:String
  // }
}, { timestamps: true });
const LectureTable = new mongoose.model("LectureTable", LectureSchema);
LectureSchema.index({ batch: 1, subject: 1, isActive: 1 })
module.exports = {
  LectureTable,
};