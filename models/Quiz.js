const mongoose = require("mongoose");

const QuizTableSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  quiz_title: {
    type: String,
  },
  quiz_banner: {
    type: Object,
  },
  quiz_desc: {
    type: String,
  },
  quiz_duration: {
    type: String,
  },
  no_ques: {
    type: String,
  },
  language: {
    type: String,
    enum: ["hi", "en", "enhi"],
  },
  is_negative: {
    type: Boolean,
    default: false,
  },
  negativeMarks: {
    type: String,
    default: "",
  },
  eachQueMarks: {
    type: String,
    default: "",
  },
  is_active: {
    type: Boolean,
  },
  result_type: {
    type: Boolean,
  },
  link: {
    type: String,
    default: 'none',
    enum: ['none', 'batch', 'testSeries' , 'scholarshipTest']
  },
  linkWith: {
    type: String,
    default: ''
  },
  created_at: {
    type: String,
  },
  shareLink : {
    type : Object ,
    default : {
        link : "" ,
        text : ""
    }
  },
  is_manual: {
    type: Boolean,
    default: true,
  },
  updated_at: {
    type: String,
  },
  category: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'categoryTable',
          default: null
   }],
  subCategory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subCategoryTable',
    default: null
  }],
}, { timestamps: true });

const QuizTable = new mongoose.model("QuizTable", QuizTableSchema);

module.exports = {
  QuizTable,
};
