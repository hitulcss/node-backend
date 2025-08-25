
const mongoose = require("mongoose");
const { formatDate } = require("../middleware/dateConverter");

const TestSeriesTestSchema = new mongoose.Schema({
  user_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  TestSeries: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestSeriesTable",
  },
  Test_title: {
    type: String,
  },
  Test_code: {
    type: String,
  },
  instructions: {
    type: String,
  },
  starting_date: {
    type: String,
  },
  created_at: {
    type: String,
  },
  No_of_questions: {
    type: Number,
  },
  question_paper: {
    type: Object,
  },
  answer_template: {
    type: Object,
  },
  totalMarks: {
    type: String,
  },
  question_paper_type: {
    type: String,
    enum: ["subjective", "objective"],
  },
  updated_at: {
    type: String,
    default: formatDate(new Date()),
  },
  negativemarking: {
    type: Boolean,
  },
  negativeMarks: {
    type: String,
    default: "",
  },
  eachQueMarks: {
    type: String,
    default: "",
  },
  duration: {
    type: String,
  },
  is_manual: {
    type: Boolean,
    default: true,
  },
});

const TestSeriesTestTable = new mongoose.model(
  "TestSeriesTestTable",
  TestSeriesTestSchema
);

module.exports = {
  TestSeriesTestTable,
};