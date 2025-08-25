const mongoose = require('mongoose');
const previousYearQuestionPapersSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adminTeacherTable',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categoryTable",
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subCategoryTable",
  },
  title: {
    type: String,
    default: ""
  },
  file_url: {
    type: Object,
    default: {},
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    enum: ['hi', 'en', 'enhi'],
    default: 'en'
  },
  created_At: {
    type: String,
    default: ""
  },
}, { timestamps: true })

const previousYearQuestionPapersTable = new mongoose.model("previousYearQuestionPapersTable", previousYearQuestionPapersSchema);

module.exports = {
  previousYearQuestionPapersTable
}